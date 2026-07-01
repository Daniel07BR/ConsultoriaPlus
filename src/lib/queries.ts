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
  opts: { filter?: string; search?: string; savedOnly?: boolean; from?: string; to?: string; feed?: string; limit?: number; offset?: number } = {},
) {
  const where: Record<string, unknown> = {};
  if (opts.filter && opts.filter !== 'Todos') where.category = opts.filter;
  if (opts.savedOnly) {
    // "Salvos" é global: abrange os dois feeds (o usuário só pode ter salvo o que acessa).
    where.saves = { some: { userId: me.user.id } };
  } else {
    // Feed: separa estudos x gestão (o acesso ao feed de gestão é checado na rota).
    where.feed = opts.feed === 'gestao' ? 'gestao' : 'estudos';
  }
  const created: Record<string, Date> = {};
  if (opts.from) created.gte = new Date(opts.from + 'T00:00:00');
  if (opts.to) created.lte = new Date(opts.to + 'T23:59:59');
  if (Object.keys(created).length) where.createdAt = created;

  // Busca no banco (título/conteúdo/autor/categoria) — permite paginar sem trazer tudo.
  const q = (opts.search || '').trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { body: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { author: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const limit = Math.min(Math.max(opts.limit ?? 12, 1), 50);
  const offset = Math.max(opts.offset ?? 0, 0);

  const [total, rows] = await Promise.all([
    prisma.study.count({ where }),
    prisma.study.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        author: { select: { name: true, cargo: true, avatar: true, department: true } },
        attachments: true,
        _count: { select: { likes: true, comments: true, views: true } },
        likes: { where: { userId: me.user.id }, select: { userId: true } },
        saves: { where: { userId: me.user.id }, select: { userId: true } },
        views: { where: { userId: me.user.id }, select: { userId: true } },
      },
    }),
  ]);

  let studies = rows.map((s) => ({
    id: s.id,
    feed: s.feed,
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
    openQuestion: false,
    attachments: s.attachments.map((a) => ({ kind: a.kind, name: a.name, meta: a.meta, url: a.url })),
  }));

  // Pergunta em aberto = existe pergunta cuja última é mais nova que a última
  // resposta de consultor (ou sem resposta). Só interessa a quem responde
  // (consultor/diretoria); marca o card e o sobe para o topo do feed.
  if (me.canConsultor && studies.length) {
    const ids = studies.map((s) => s.id);
    const [qMax, rMax] = await Promise.all([
      prisma.comment.groupBy({ by: ['studyId'], where: { studyId: { in: ids }, isQuestion: true }, _max: { createdAt: true } }),
      prisma.comment.groupBy({ by: ['studyId'], where: { studyId: { in: ids }, role: 'consultor' }, _max: { createdAt: true } }),
    ]);
    const lastQ = new Map(qMax.map((g) => [g.studyId, g._max.createdAt?.getTime() ?? 0]));
    const lastR = new Map(rMax.map((g) => [g.studyId, g._max.createdAt?.getTime() ?? 0]));
    studies = studies.map((s) => {
      const q = lastQ.get(s.id) ?? 0;
      const r = lastR.get(s.id) ?? 0;
      return { ...s, openQuestion: q > 0 && q > r };
    });
    // Perguntas em aberto primeiro; mantém a ordem por data dentro de cada grupo.
    studies = [...studies.filter((s) => s.openQuestion), ...studies.filter((s) => !s.openQuestion)];
  }
  return { studies, total };
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
    feed: s.feed,
    mine: s.authorId === me.user.id,
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
  id: string; number: number; subject: string; category: string; status: string; rating: number | null; ratingLabel: string | null;
  createdAt: Date; requester: { name: string; avatar: string | null; department?: string | null };
  assignee?: { name: string; avatar: string | null } | null;
  messages: { text: string; authorId: string; role: string; deletedAt: Date | null; author: { name: string; avatar: string | null }; reads: { userId: string }[] }[];
}, meId: string) {
  const last = t.messages[t.messages.length - 1];
  // "Não vistas" para mim: mensagens da outra ponta (não minhas), não excluídas e
  // sem recibo de leitura meu. É o que alimenta a marcação por chamado e o badge do menu.
  const unseen = t.messages.filter((m) => !m.deletedAt && m.authorId !== meId && m.reads.length === 0).length;
  // Consultor que está respondendo = autor da última mensagem de consultor (não excluída).
  const consultorMsgs = t.messages.filter((m) => !m.deletedAt && m.role === 'consultor');
  const lastConsultor = consultorMsgs[consultorMsgs.length - 1];
  const responder = lastConsultor ? { name: lastConsultor.author.name, avatar: lastConsultor.author.avatar } : null;
  // Responsável ("assumiu o chamado"): quem está atendendo, mesmo sem ter respondido.
  const assignee = t.assignee ? { name: t.assignee.name, avatar: t.assignee.avatar } : null;
  return {
    id: t.id,
    number: t.number,
    subject: t.subject,
    category: t.category,
    status: t.status,
    rating: t.rating,
    ratingLabel: t.ratingLabel,
    createdAt: t.createdAt.toISOString(),
    author: { name: t.requester.name, avatar: t.requester.avatar, department: (t.requester as { department?: string | null }).department ?? null },
    responder,
    assignee,
    msgCount: t.messages.length,
    lastPreview: last ? (last.text.length > 150 ? last.text.slice(0, 150).trim() + '…' : last.text) : '',
    unseen,
  };
}

export async function listTickets(me: CurrentUser, status?: string) {
  const where: Record<string, unknown> = { ...ticketScope(me) };
  // Fila de atendimento / meus chamados: finalizados (fechado) ficam só no histórico.
  if (status && status !== 'todos') where.status = status;
  else where.status = { not: 'fechado' };
  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: { requester: { select: { name: true, avatar: true, department: true } }, assignee: { select: { name: true, avatar: true } }, messages: { orderBy: { createdAt: 'asc' }, select: { text: true, authorId: true, role: true, deletedAt: true, author: { select: { name: true, avatar: true } }, reads: { where: { userId: me.user.id }, select: { userId: true } } } } },
  });
  return tickets.map((t) => ticketSummary(t, me.user.id));
}

/** Histórico global: TODOS os chamados, visível a todos. Busca por título, autor e período. */
export async function listTicketsHistory(
  me: CurrentUser,
  opts: { q?: string; requester?: string; from?: string; to?: string; limit?: number; offset?: number } = {},
) {
  const where: Record<string, unknown> = {};
  if (opts.q) {
    // Busca por palavra-chave no título OU pelo número do chamado (#123 ou 123).
    const num = parseInt(opts.q.replace(/^#/, ''), 10);
    const or: Record<string, unknown>[] = [{ subject: { contains: opts.q, mode: 'insensitive' } }];
    if (Number.isInteger(num)) or.push({ number: num });
    where.OR = or;
  }
  if (opts.requester) where.requester = { name: { contains: opts.requester, mode: 'insensitive' } };
  const created: Record<string, Date> = {};
  if (opts.from) created.gte = new Date(opts.from + 'T00:00:00');
  if (opts.to) created.lte = new Date(opts.to + 'T23:59:59');
  if (Object.keys(created).length) where.createdAt = created;

  const limit = Math.min(Math.max(opts.limit ?? 15, 1), 50);
  const offset = Math.max(opts.offset ?? 0, 0);

  const [total, tickets] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: { requester: { select: { name: true, avatar: true, department: true } }, assignee: { select: { name: true, avatar: true } }, messages: { orderBy: { createdAt: 'asc' }, select: { text: true, authorId: true, role: true, deletedAt: true, author: { select: { name: true, avatar: true } }, reads: { where: { userId: me.user.id }, select: { userId: true } } } } },
    }),
  ]);
  return { tickets: tickets.map((t) => ticketSummary(t, me.user.id)), total };
}

export async function getTicket(me: CurrentUser, id: string) {
  const t = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, avatar: true, department: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
      reference: { select: { id: true, number: true, subject: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { name: true, avatar: true, department: true } },
          reads: { include: { user: { select: { id: true, name: true, avatar: true, baseRole: true } } } },
        },
      },
    },
  });
  if (!t) return null;
  const isOwner = t.requesterId === me.user.id;
  const isClosed = t.status === 'fechado';
  const auditCount = await prisma.ticketMessageRevision.count({ where: { ticketId: t.id } });

  return {
    id: t.id,
    number: t.number,
    reference: t.reference ? { id: t.reference.id, number: t.reference.number, subject: t.reference.subject } : null,
    subject: t.subject,
    category: t.category,
    status: t.status,
    rating: t.rating,
    ratingLabel: t.ratingLabel,
    closedAt: t.closedAt ? t.closedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    author: { name: t.requester.name, avatar: t.requester.avatar, department: (t.requester as { department?: string | null }).department ?? null },
    // Consultor que assumiu o chamado (está atendendo), independente de já ter respondido.
    assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, avatar: t.assignee.avatar } : null,
    // Responder: dono ou consultor, e não fechado. Avaliar/fechar: só o dono, se ainda não fechou.
    canReply: (isOwner || me.canConsultor) && !isClosed,
    canClose: isOwner && !isClosed,
    canEdit: (isOwner || me.canConsultor) && !isClosed, // editar título / citação
    canAssign: me.canConsultor && !isClosed, // pode assumir/liberar o chamado
    assignedToMe: t.assigneeId === me.user.id, // o responsável sou eu
    auditCount, // só interessa ao consultor; controla o botão Auditoria no client
    messages: t.messages.map((m) => {
      const deleted = !!m.deletedAt;
      // Conteúdo de mensagem excluída é legível só pelo consultor; cliente vê o aviso.
      const showText = !deleted || me.canConsultor;
      return {
        id: m.id,
        author: { name: m.author.name, avatar: m.author.avatar, department: m.author.department },
        role: m.role,
        text: showText ? m.text : '',
        edited: !!m.editedAt,
        deleted,
        deletedReason: deleted ? m.deleteReason : null,
        deletedByName: deleted ? m.deletedByName : null,
        deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
        mine: m.authorId === me.user.id,
        createdAt: m.createdAt.toISOString(),
        // Quem leu esta mensagem (estilo "visto"): papel = cliente se for quem abriu, senão consultor.
        // Só conta como "visto" a leitura do CLIENTE dono ou de um CONSULTOR de verdade
        // (base_role 'consultor'). Diretoria/admin ('both') têm acesso e suas leituras são
        // registradas p/ zerar o alerta deles, mas NÃO devem aparecer como recibo de leitura.
        reads: m.reads
          .filter((r) => r.userId === t.requesterId || r.user.baseRole === 'consultor')
          .slice()
          .sort((a, b) => a.readAt.getTime() - b.readAt.getTime())
          .map((r) => ({
            name: r.user.name,
            avatar: r.user.avatar,
            role: r.userId === t.requesterId ? 'cliente' : 'consultor',
            readAt: r.readAt.toISOString(),
          })),
      };
    }),
  };
}

/** Trilha de auditoria de um chamado (edições/exclusões de mensagens), mais recente primeiro. */
export async function ticketAudit(ticketId: string) {
  const revs = await prisma.ticketMessageRevision.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
    include: { message: { select: { author: { select: { name: true } }, role: true } } },
  });
  return revs.map((r) => ({
    id: r.id,
    action: r.action, // edit | delete
    previousText: r.previousText,
    newText: r.newText,
    reason: r.reason,
    editorName: r.editorName,
    editorRole: r.editorRole,
    messageAuthor: r.message?.author?.name ?? null,
    messageRole: r.message?.role ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Busca enxuta p/ citar um chamado anterior: por número (#123 ou 123) ou palavra-chave no título.
 *  Escopo: cliente vê os próprios; consultor/both vê todos. Exclui o próprio chamado (excludeId). */
export async function searchTickets(me: CurrentUser, q: string, excludeId?: string) {
  const term = (q || '').trim();
  if (!term) return [];
  const num = parseInt(term.replace(/^#/, ''), 10);
  const or: Record<string, unknown>[] = [{ subject: { contains: term, mode: 'insensitive' } }];
  if (Number.isInteger(num)) or.push({ number: num });

  const where: Record<string, unknown> = { ...ticketScope(me), OR: or };
  if (excludeId) where.id = { not: excludeId };

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { requester: { select: { name: true, avatar: true } } },
  });
  return tickets.map((t) => ({
    id: t.id,
    number: t.number,
    subject: t.subject,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    author: { name: t.requester.name, avatar: t.requester.avatar },
  }));
}

// ---------- Contadores / notificações ----------

export async function counts(me: CurrentUser) {
  const [openTickets, saved, unread, unseenTickets] = await Promise.all([
    prisma.ticket.count({ where: { ...ticketScope(me), status: { in: ['aberto', 'andamento'] } } }),
    prisma.studySave.count({ where: { userId: me.user.id } }),
    prisma.notification.count({ where: { userId: me.user.id, read: false, targetType: { in: ['study', 'gestaoStudy'] } } }),
    // Chamados (não fechados) com pelo menos uma mensagem da outra ponta ainda não
    // vista por mim — é o número que vai no badge do menu "Chamados".
    prisma.ticket.count({
      where: {
        ...ticketScope(me),
        status: { not: 'fechado' },
        messages: { some: { deletedAt: null, authorId: { not: me.user.id }, reads: { none: { userId: me.user.id } } } },
      },
    }),
  ]);
  return { openTickets, unseenTickets, saved, unread };
}

export async function listNotifications(me: CurrentUser, opts: { limit?: number; offset?: number } = {}) {
  // Só comentários/perguntas em publicações (feed estudos/gestão). Chamados não
  // geram mais notificação; registros antigos de chamado ficam de fora do filtro.
  const where = { userId: me.user.id, targetType: { in: ['study', 'gestaoStudy'] } };
  const take = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const skip = Math.max(opts.offset ?? 0, 0);
  const [ns, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.notification.count({ where }),
  ]);
  return {
    total,
    notifications: ns.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      targetType: n.targetType,
      targetId: n.targetId,
      commentId: n.commentId,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}
