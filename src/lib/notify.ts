import 'server-only';
import { prisma } from './db';

// Notificações do Consultoria Plus = SÓ comentários e perguntas em publicações
// (feed de estudos / gestão). Chamados têm badge próprio no menu; não geram mais
// notificação aqui. Cada registro guarda o comentário específico (commentId) para
// o clique abrir a publicação já posicionada nele, e o feed no targetType
// (study = estudos, gestaoStudy = gestão) para abrir na rota certa.

async function consultorUserIds(exclude?: string): Promise<string[]> {
  const us = await prisma.appUser.findMany({
    where: { baseRole: { in: ['consultor', 'both'] }, status: { not: 'inactive' } },
    select: { id: true },
  });
  return us.map((u) => u.id).filter((id) => id !== exclude);
}

async function bulk(userIds: string[], n: Omit<NotifInput, 'userId'>) {
  if (!userIds.length) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...n })),
  });
}

interface NotifInput {
  userId: string;
  kind: string;
  title: string;
  body: string;
  targetType?: string;
  targetId?: string;
  commentId?: string;
}

export async function notifyOnComment(
  studyId: string,
  commentId: string,
  commenter: { id: string; name: string },
  isQuestion: boolean,
  role: string,
  feed: string = 'estudos',
) {
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { title: true, authorId: true },
  });
  if (!study) return;
  const targetType = feed === 'gestao' ? 'gestaoStudy' : 'study';
  const t = { targetType, targetId: studyId, commentId };

  // Feed de Gestão: sem papel consultor/cliente — qualquer comentário apenas
  // avisa o autor da publicação.
  if (feed === 'gestao') {
    if (study.authorId !== commenter.id) {
      await prisma.notification.create({
        data: { userId: study.authorId, kind: 'estudo', title: commenter.name, body: `comentou na sua publicação "${study.title}".`, ...t },
      });
    }
    return;
  }

  if (role === 'consultor') {
    // Resposta do consultor → avisa os clientes que comentaram/perguntaram nesse estudo.
    const commenters = await prisma.comment.findMany({
      where: { studyId, role: 'cliente' },
      select: { authorId: true },
      distinct: ['authorId'],
    });
    const ids = commenters.map((c) => c.authorId).filter((id) => id !== commenter.id);
    await bulk(ids, { kind: 'resposta', title: commenter.name, body: `respondeu no estudo "${study.title}".`, ...t });
  } else if (isQuestion) {
    // Pergunta de cliente → alerta a EQUIPE de consultores (alguém precisa responder).
    const ids = await consultorUserIds(commenter.id);
    await bulk(ids, { kind: 'pergunta', title: commenter.name, body: `fez uma pergunta no estudo "${study.title}".`, ...t });
  } else {
    // Comentário comum de cliente → também alerta a EQUIPE de consultores (não só o
    // autor), para aparecer no inbox deles como "comentário" (cor distinta da pergunta).
    const ids = await consultorUserIds(commenter.id);
    await bulk(ids, { kind: 'estudo', title: commenter.name, body: `comentou no estudo "${study.title}".`, ...t });
  }
}
