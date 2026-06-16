// Dispara comunicado no Nexus quando um estudo é publicado aqui.
// Recipientes = TODOS os AppUsers ativos com nexus_user_id — quem tem acesso ao
// Consultoria Plus já está na tabela local (espelho do diretório por permissão).
// Fire-and-forget: nunca derruba a criação do estudo.

import 'server-only';
import { prisma } from './db';
import { pushAnnouncementToNexus } from './nexus';

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
