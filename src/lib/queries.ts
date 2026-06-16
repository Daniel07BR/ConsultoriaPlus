import 'server-only';
import { prisma } from './db';
import type { CurrentUser } from './auth';

// ---------- Estudos ----------

function excerptOf(body: string): string {
  const first = body.split('\n\n')[0] || '';
  return first.length > 200 ? first.slice(0, 200).trim() + '…' : first;
}

export async function listStudies(
  me: CurrentUser,
  opts: { filter?: string; search?: string; savedOnly?: boolean; from?: string; to?: string } = {},
) {
  const where: Record<string, unknown> = {};
  if (opts.filter && opts.filter !== 'Todos') where.category = opts.filter;
  if (opts.savedOnly) where.saves = { some: { userId: me.user.id } };
  const created: Record<string, Date> = {};
  if (opts.from) created.gte = new Date(opts.from + 'T00:00:00');
  if (opts.to) created.lte = new Date(opts.to + 'T23:59:59');
  if (Object.keys(created).length) where.createdAt = created;

  let studies = await prisma.study.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { name: true, cargo: true, avatar: true, department: true } },
      attachments: true,
      _count: { select: { likes: true, comments: true, views: true } },
      likes: { where: { userId: me.user.id }, select: { userId: true } },
      saves: { where: { userId: me.user.id }, select: { userId: true } },
      views: { where: { userId: me.user.id }, select: { userId: true } },
    },
  });

  const q = (opts.search || '').trim().toLowerCase();
  if (q) {
    studies = studies.filter((s) =>
      (s.title + ' ' + s.body + ' ' + s.author.name + ' ' + s.category).toLowerCase().includes(q),
    );
  }

  return studies.map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    excerpt: excerptOf(s.body),
    coverImage: s.coverImage,
    readTime: s.readTime,
    createdAt: s.createdAt.toISOString(),
    author: { name: s.author.name, title: s.author.cargo, avatar: s.author.avatar, department: s.author.department },
    likes: s._count.likes,
    liked: s.likes.length > 0,
    saved: s.saves.length > 0,
    commentCount: s._count.comments,
    views: s._count.views,
    viewed: s.views.length > 0,
    attachments: s.attachments.map((a) => ({ kind: a.kind, name: a.name, meta: a.meta, url: a.url })),
  }));
}

export async function getStudy(me: CurrentUser, id: string) {
  const s = await prisma.study.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, cargo: true, avatar: true, department: true } },
      attachments: true,
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { name: true, avatar: true, department: true } } },
      },
      _count: { select: { likes: true, views: true } },
      likes: { where: { userId: me.user.id }, select: { userId: true } },
      saves: { where: { userId: me.user.id }, select: { userId: true } },
      views: { where: { userId: me.user.id }, select: { userId: true } },
    },
  });
  if (!s) return null;
  return {
    id: s.id,
    title: s.title,
    category: s.category,
    body: s.body.split('\n\n'),
    coverImage: s.coverImage,
    readTime: s.readTime,
    createdAt: s.createdAt.toISOString(),
    author: { name: s.author.name, title: s.author.cargo, avatar: s.author.avatar, department: s.author.department },
    likes: s._count.likes,
    liked: s.likes.length > 0,
    saved: s.saves.length > 0,
    views: s._count.views,
    viewed: s.views.length > 0,
    attachments: s.attachments.map((a) => ({ kind: a.kind, name: a.name, meta: a.meta, url: a.url })),
    comments: s.comments.map((c) => ({
      id: c.id,
      author: { name: c.author.name, avatar: c.author.avatar, department: c.author.department },
      role: c.role,
      text: c.text,
      isQuestion: c.isQuestion,
      mine: c.authorId === me.user.id,
      createdAt: c.createdAt.toISOString(),
    })),
    commentCount: s.comments.length,
  };
}

// ---------- Chamados ----------

/** Cliente vê só os próprios; consultor/both vê todos. */
function ticketScope(me: CurrentUser): Record<string, unknown> {
  return me.canConsultor ? {} : { requesterId: me.user.id };
}

function ticketSummary(t: {
  id: string; subject: string; category: string; status: string; rating: number | null; ratingLabel: string | null;
  createdAt: Date; requester: { name: string; avatar: string | null; department?: string | null }; messages: { text: string }[];
}) {
  const last = t.messages[t.messages.length - 1];
  return {
    id: t.id,
    subject: t.subject,
    category: t.category,
    status: t.status,
    rating: t.rating,
    ratingLabel: t.ratingLabel,
    createdAt: t.createdAt.toISOString(),
    author: { name: t.requester.name, avatar: t.requester.avatar, department: (t.requester as { department?: string | null }).department ?? null },
    msgCount: t.messages.length,
    lastPreview: last ? (last.text.length > 150 ? last.text.slice(0, 150).trim() + '…' : last.text) : '',
  };
}

export async function listTickets(me: CurrentUser, status?: string) {
  const where: Record<string, unknown> = { ...ticketScope(me) };
  if (status && status !== 'todos') where.status = status;
  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: { requester: { select: { name: true, avatar: true, department: true } }, messages: { orderBy: { createdAt: 'asc' }, select: { text: true } } },
  });
  return tickets.map(ticketSummary);
}

/** Histórico global: TODOS os chamados, visível a todos. Busca por título, autor e período. */
export async function listTicketsHistory(
  _me: CurrentUser,
  opts: { q?: string; requester?: string; from?: string; to?: string } = {},
) {
  const where: Record<string, unknown> = {};
  if (opts.q) where.subject = { contains: opts.q, mode: 'insensitive' };
  if (opts.requester) where.requester = { name: { contains: opts.requester, mode: 'insensitive' } };
  const created: Record<string, Date> = {};
  if (opts.from) created.gte = new Date(opts.from + 'T00:00:00');
  if (opts.to) created.lte = new Date(opts.to + 'T23:59:59');
  if (Object.keys(created).length) where.createdAt = created;

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { requester: { select: { name: true, avatar: true, department: true } }, messages: { orderBy: { createdAt: 'asc' }, select: { text: true } } },
  });
  return tickets.map(ticketSummary);
}

export async function getTicket(me: CurrentUser, id: string) {
  const t = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, avatar: true, department: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { name: true, avatar: true, department: true } } },
      },
    },
  });
  if (!t) return null;
  const isOwner = t.requesterId === me.user.id;
  const isClosed = t.status === 'fechado';

  return {
    id: t.id,
    subject: t.subject,
    category: t.category,
    status: t.status,
    rating: t.rating,
    ratingLabel: t.ratingLabel,
    closedAt: t.closedAt ? t.closedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    author: { name: t.requester.name, avatar: t.requester.avatar, department: (t.requester as { department?: string | null }).department ?? null },
    // Responder: dono ou consultor, e não fechado. Avaliar/fechar: só o dono, se ainda não fechou.
    canReply: (isOwner || me.canConsultor) && !isClosed,
    canClose: isOwner && !isClosed,
    messages: t.messages.map((m) => ({
      id: m.id,
      author: { name: m.author.name, avatar: m.author.avatar, department: m.author.department },
      role: m.role,
      text: m.text,
      mine: m.authorId === me.user.id,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

// ---------- Contadores / notificações ----------

export async function counts(me: CurrentUser) {
  const [openTickets, saved, unread] = await Promise.all([
    prisma.ticket.count({ where: { ...ticketScope(me), status: { in: ['aberto', 'andamento'] } } }),
    prisma.studySave.count({ where: { userId: me.user.id } }),
    prisma.notification.count({ where: { userId: me.user.id, read: false } }),
  ]);
  return { openTickets, saved, unread };
}

export async function listNotifications(me: CurrentUser) {
  const ns = await prisma.notification.findMany({
    where: { userId: me.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ns.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    targetType: n.targetType,
    targetId: n.targetId,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
}
