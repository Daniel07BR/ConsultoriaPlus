import 'server-only';
import { prisma } from './db';

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
}

export async function notifyOnComment(
  studyId: string,
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
  const t = { targetType: 'study', targetId: studyId };

  // Feed de Gestão: sem papel consultor/cliente — qualquer comentário apenas
  // avisa o autor da publicação (notificação interna, sem pool de consultores).
  if (feed === 'gestao') {
    if (study.authorId !== commenter.id) {
      await prisma.notification.create({
        data: { userId: study.authorId, kind: 'estudo', title: commenter.name, body: `comentou na sua publicação "${study.title}".`, ...t },
      });
    }
    return;
  }

  if (role === 'consultor') {
    // Avisa os clientes que comentaram/perguntaram nesse estudo.
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
  } else if (study.authorId !== commenter.id) {
    // Comentário comum → avisa o autor do estudo.
    await prisma.notification.create({
      data: { userId: study.authorId, kind: 'estudo', title: commenter.name, body: `comentou no seu estudo "${study.title}".`, ...t },
    });
  }
}

export async function notifyTicketClosed(
  ticket: { id: string; subject: string },
  closer: { id: string; name: string },
  rating: number,
  label: string,
) {
  const ids = await consultorUserIds(closer.id);
  await bulk(ids, {
    kind: 'chamado',
    title: closer.name,
    body: `fechou o chamado "${ticket.subject}" — avaliou: ${rating}★ ${label}.`,
    targetType: 'ticket',
    targetId: ticket.id,
  });
}

export async function notifyNewTicket(ticketId: string, subject: string, requester: { id: string; name: string }) {
  const ids = await consultorUserIds(requester.id);
  await bulk(ids, {
    kind: 'chamado',
    title: requester.name,
    body: `abriu um novo chamado: "${subject}".`,
    targetType: 'ticket',
    targetId: ticketId,
  });
}

export async function notifyTicketReply(
  ticket: { id: string; subject: string; requesterId: string },
  sender: { id: string; name: string },
  role: string,
) {
  const t = { targetType: 'ticket', targetId: ticket.id };
  if (role === 'consultor') {
    if (ticket.requesterId !== sender.id) {
      await prisma.notification.create({
        data: { userId: ticket.requesterId, kind: 'chamado', title: 'Seu chamado foi respondido', body: `— "${ticket.subject}".`, ...t },
      });
    }
  } else {
    const ids = await consultorUserIds(sender.id);
    await bulk(ids, { kind: 'chamado', title: sender.name, body: `respondeu no chamado "${ticket.subject}".`, ...t });
  }
}
