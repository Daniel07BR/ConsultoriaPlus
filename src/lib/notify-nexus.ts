// Dispara comunicado no Nexus quando um estudo é publicado aqui.
// Recipientes = TODOS os AppUsers ativos com nexus_user_id — quem tem acesso ao
// Consultoria Plus já está na tabela local (espelho do diretório por permissão).
// Fire-and-forget: nunca derruba a criação do estudo.

import 'server-only';
import { prisma } from './db';
import { pushAnnouncementToNexus } from './nexus';
import { canSeeGestaoStudy, effectiveRole } from './roles';

function excerpt(body: string, max = 240): string {
  const first = (body.split('\n\n')[0] || '').trim();
  return first.length > max ? first.slice(0, max).trim() + '…' : first;
}

interface NotifyInput {
  studyId: string;
  authorNexusUserId: string; // employeeId Nexus do autor
  title: string;
  body: string;
  category: string;
  authorAvatar?: string | null; // foto de perfil do autor (data URI) — usada como imagem do comunicado
  excludedDepartments?: string[]; // Feed de Gestão: deptos ocultos (Gestor/Sub não são avisados)
}

/**
 * Empurra o estudo como comunicado no Nexus. Atualiza Study.nexusAnnouncementId
 * com o id retornado. Roda sem await no callsite (fire-and-forget).
 */
export async function notifyNexusAboutStudy(input: NotifyInput): Promise<void> {
  try {
    // Destinatários: AppUsers ativos com nexus_user_id (= quem tem acesso ao sistema).
    const recipients = await prisma.appUser.findMany({
      where: { status: 'active' },
      select: { nexusUserId: true },
    });
    const recipientEmployeeIds = recipients
      .map((r) => r.nexusUserId)
      .filter((id): id is string => !!id);

    // Sem imageUrl (capa do estudo é data URI — não trafega no comunicado) e
    // sem linkUrl/linkLabel: o comunicado vira o ponto de "ciência"; o estudo
    // em si é acessado pelo histórico de comunicados ou pelo próprio sistema.
    const res = await pushAnnouncementToNexus({
      authorEmployeeId: input.authorNexusUserId,
      title: `Novo estudo: ${input.title}`,
      content: excerpt(input.body),
      type: 'consultoria-plus',
      category: input.category,
      recipientEmployeeIds,
      sourceRef: input.studyId,
    });

    if (res?.id) {
      await prisma.study.update({
        where: { id: input.studyId },
        data: { nexusAnnouncementId: res.id },
      });
    }
  } catch (err) {
    console.error('[notify-nexus] failed for study', input.studyId, err);
  }
}

/**
 * Igual a notifyNexusAboutStudy, mas para o Feed de Gestão: o comunicado vai
 * APENAS para quem tem acesso ao feed (consultoria/diretoria/admin + cargos de
 * liderança Gestor/Sub-encarregado). Fire-and-forget.
 */
export async function notifyNexusAboutGestaoStudy(input: NotifyInput): Promise<void> {
  try {
    // Destinatários = AppUsers ativos que passam no mesmo critério de canAccessGestao,
    // respeitando a segmentação por departamento: quem é Gestor/Sub de um depto oculto
    // desta publicação NÃO é avisado (consultoria/diretoria/admin recebem sempre).
    const users = await prisma.appUser.findMany({
      where: { status: 'active' },
      select: { nexusUserId: true, baseRole: true, roleOverride: true, cargo: true, department: true },
    });
    const recipientEmployeeIds = users
      .filter((u) => canSeeGestaoStudy(effectiveRole(u.baseRole, u.roleOverride), u.cargo, u.department, input.excludedDepartments))
      .map((u) => u.nexusUserId)
      .filter((id): id is string => !!id);

    const res = await pushAnnouncementToNexus({
      authorEmployeeId: input.authorNexusUserId,
      title: input.title,
      content: excerpt(input.body),
      // Tipo próprio do Feed de Gestão: o Nexus usa isso p/ dar identidade visual
      // própria (cor índigo + tag "Gestão" + avatar de perfil do autor no círculo),
      // distinta do feed comum (cor da consultora + apresentadora). Sem imageUrl:
      // o Nexus usa a foto de perfil do autor (employees.avatar) como avatar.
      type: 'consultoria-gestao',
      category: input.category,
      recipientEmployeeIds,
      sourceRef: input.studyId,
    });

    if (res?.id) {
      await prisma.study.update({
        where: { id: input.studyId },
        data: { nexusAnnouncementId: res.id },
      });
    }
  } catch (err) {
    console.error('[notify-nexus] failed for gestao study', input.studyId, err);
  }
}

// Resolve o nexus_user_id de uma lista de AppUser.id (só ativos e com vínculo).
async function nexusIdsOf(appUserIds: string[]): Promise<string[]> {
  if (appUserIds.length === 0) return [];
  const us = await prisma.appUser.findMany({
    where: { id: { in: appUserIds }, status: { not: 'inactive' } },
    select: { nexusUserId: true },
  });
  return us.map((u) => u.nexusUserId).filter((id): id is string => !!id);
}

/**
 * Alerta cross-system "pergunta respondida": quando um consultor comenta num
 * estudo, avisa quem fez pergunta nele (menos o próprio autor da resposta).
 * O comunicado é PESSOAL (recipients = quem perguntou) → aparece no sino
 * embutido de QUALQUER sistema onde a pessoa esteja, no Nexus e badgeia o card
 * do Consultoria Plus. Fire-and-forget.
 */
export async function notifyNexusStudyAnswer(opts: {
  studyId: string;
  studyTitle: string;
  answererNexusUserId: string;
  answererAppUserId: string;
  answererName: string;
  commentId: string;
}): Promise<void> {
  try {
    if (!opts.answererNexusUserId) return; // autor sem vínculo Nexus → sem alerta
    // Quem fez pergunta nesse estudo (clientes), exceto o autor da resposta.
    const askers = await prisma.comment.findMany({
      where: { studyId: opts.studyId, isQuestion: true },
      select: { authorId: true },
      distinct: ['authorId'],
    });
    const targetAppIds = askers.map((a) => a.authorId).filter((id) => id !== opts.answererAppUserId);
    const recipientEmployeeIds = await nexusIdsOf(targetAppIds);
    if (recipientEmployeeIds.length === 0) return;

    await pushAnnouncementToNexus({
      authorEmployeeId: opts.answererNexusUserId,
      title: `Resposta no estudo: ${opts.studyTitle}`,
      content: `${opts.answererName} respondeu uma pergunta no estudo "${opts.studyTitle}". Abra o Consultoria Plus para ver.`,
      type: 'consultoria-plus',
      category: 'Resposta',
      recipientEmployeeIds,
      sourceRef: `answer-${opts.commentId}`,
      crossSystem: true,
    });
  } catch (err) {
    console.error('[notify-nexus] study answer failed', opts.studyId, err);
  }
}

/**
 * Alerta cross-system para a EQUIPE de consultores quando algo novo precisa de
 * resposta (pergunta nova num estudo, ou chamado novo aberto). Assim um
 * consultor que está noutro sistema vê o sino acender. Fire-and-forget.
 */
export async function notifyNexusNeedsAnswer(opts: {
  kind: 'pergunta' | 'chamado';
  refId: string; // commentId ou ticketId
  title: string; // título do estudo ou assunto do chamado
  requesterNexusUserId: string;
  requesterAppUserId: string;
  requesterName: string;
}): Promise<void> {
  try {
    if (!opts.requesterNexusUserId) return;
    const consultores = await prisma.appUser.findMany({
      where: { baseRole: { in: ['consultor', 'both'] }, status: { not: 'inactive' } },
      select: { id: true },
    });
    const targetAppIds = consultores.map((c) => c.id).filter((id) => id !== opts.requesterAppUserId);
    const recipientEmployeeIds = await nexusIdsOf(targetAppIds);
    if (recipientEmployeeIds.length === 0) return;

    const isPergunta = opts.kind === 'pergunta';
    await pushAnnouncementToNexus({
      authorEmployeeId: opts.requesterNexusUserId,
      title: isPergunta ? `Nova pergunta: ${opts.title}` : `Novo chamado: ${opts.title}`,
      content: isPergunta
        ? `${opts.requesterName} fez uma pergunta no estudo "${opts.title}". Abra o Consultoria Plus para responder.`
        : `${opts.requesterName} abriu o chamado "${opts.title}". Abra o Consultoria Plus para responder.`,
      type: 'consultoria-plus',
      category: isPergunta ? 'Pergunta' : 'Chamado',
      recipientEmployeeIds,
      sourceRef: `${opts.kind}-${opts.refId}`,
      crossSystem: true,
    });
  } catch (err) {
    console.error('[notify-nexus] needs-answer failed', opts.refId, err);
  }
}

/**
 * Alerta cross-system de resposta em chamado: avisa a outra ponta (se consultor
 * respondeu → avisa o requester; se requester respondeu → avisa os consultores).
 * Pessoal por destinatário; cruza sistemas. Fire-and-forget.
 */
export async function notifyNexusTicketReply(opts: {
  ticketId: string;
  subject: string;
  messageId: string;
  senderRole: string; // 'consultor' | 'cliente'
  senderNexusUserId: string;
  senderAppUserId: string;
  senderName: string;
  requesterAppUserId: string;
}): Promise<void> {
  try {
    if (!opts.senderNexusUserId) return;
    let targetAppIds: string[];
    if (opts.senderRole === 'consultor') {
      // avisa o dono do chamado
      targetAppIds = opts.requesterAppUserId !== opts.senderAppUserId ? [opts.requesterAppUserId] : [];
    } else {
      // cliente respondeu → avisa a equipe de consultores
      const consultores = await prisma.appUser.findMany({
        where: { baseRole: { in: ['consultor', 'both'] }, status: { not: 'inactive' } },
        select: { id: true },
      });
      targetAppIds = consultores.map((c) => c.id).filter((id) => id !== opts.senderAppUserId);
    }
    const recipientEmployeeIds = await nexusIdsOf(targetAppIds);
    if (recipientEmployeeIds.length === 0) return;

    const isConsultorReply = opts.senderRole === 'consultor';
    await pushAnnouncementToNexus({
      authorEmployeeId: opts.senderNexusUserId,
      title: isConsultorReply ? `Resposta no seu chamado: ${opts.subject}` : `Nova mensagem no chamado: ${opts.subject}`,
      content: isConsultorReply
        ? `${opts.senderName} respondeu seu chamado "${opts.subject}". Abra o Consultoria Plus para ver.`
        : `${opts.senderName} enviou uma mensagem no chamado "${opts.subject}". Abra o Consultoria Plus para ver.`,
      type: 'consultoria-plus',
      category: 'Chamado',
      recipientEmployeeIds,
      sourceRef: `ticketmsg-${opts.messageId}`,
      crossSystem: true,
    });
  } catch (err) {
    console.error('[notify-nexus] ticket reply failed', opts.ticketId, err);
  }
}
