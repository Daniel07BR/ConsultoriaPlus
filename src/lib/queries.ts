import 'server-only';
import { prisma } from './db';
import type { CurrentUser } from './auth';
import { isDeptFiltered } from './roles';

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
  // Segmentação por departamento (estudos e gestão): o cliente só enxerga publicações
  // que NÃO ocultam o seu departamento (o autor sempre vê o próprio post). Consultoria/
  // diretoria/admin (staff) não são filtrados. Publicação sem deptos ocultos → todos veem.
  if (isDeptFiltered(me.role)) {
    const dept = (me.user.department ?? '').trim();
    where.AND = [{ OR: [{ authorId: me.user.id }, { NOT: { excludedDepartments: { has: dept } } }] }];
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

  const total = await prisma.study.count({ where });

  // Consultor: publicações com PERGUNTA EM ABERTO (última pergunta mais nova que a
  // última resposta de consultor) são fixadas no TOPO do feed — GLOBAL, respeitando
  // o filtro/busca atual, valendo entre páginas (não só a página carregada).
  let openStudyIds: string[] = [];
  const askersByStudy = new Map<string, { name: string; avatar: string | null }[]>();
  if (me.canConsultor && !opts.savedOnly) {
    const scope = await prisma.study.findMany({ where, select: { id: true } });
    const scopeIds = scope.map((s) => s.id);
    if (scopeIds.length) {
      const qs = await prisma.comment.findMany({
        where: { isQuestion: true, studyId: { in: scopeIds } },
        select: { studyId: true, createdAt: true, author: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      });
      if (qs.length) {
        const lastQ = new Map<string, number>();
        for (const c of qs) { const tms = c.createdAt.getTime(); if (tms > (lastQ.get(c.studyId) ?? 0)) lastQ.set(c.studyId, tms); }
        const sids = [...lastQ.keys()];
        const replies = await prisma.comment.groupBy({ by: ['studyId'], where: { studyId: { in: sids }, role: 'consultor' }, _max: { createdAt: true } });
        const lastR = new Map(replies.map((r) => [r.studyId, r._max.createdAt?.getTime() ?? 0]));
        openStudyIds = sids.filter((id) => (lastQ.get(id) ?? 0) > (lastR.get(id) ?? 0));
        // Quem tem pergunta PENDENTE (após a última resposta) em cada estudo aberto —
        // vira o badge com foto no card. qs vem do mais recente ao mais antigo.
        const openSetTmp = new Set(openStudyIds);
        for (const c of qs) {
          if (!openSetTmp.has(c.studyId) || c.createdAt.getTime() <= (lastR.get(c.studyId) ?? 0)) continue;
          const arr = askersByStudy.get(c.studyId) ?? [];
          if (!arr.some((a) => a.name === c.author.name)) arr.push({ name: c.author.name, avatar: c.author.avatar });
          askersByStudy.set(c.studyId, arr);
        }
      }
    }
  }

  // Monta a página: fixadas (por data) primeiro, depois o restante paginado. O
  // offset "atravessa" as fixadas para o bloco normal quando elas acabam.
  const pinnedAll = openStudyIds.length
    ? await prisma.study.findMany({
        where: { ...where, id: { in: openStudyIds } },
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true, cargo: true, avatar: true, department: true } },
          attachments: true,
          _count: { select: { likes: true, comments: true, views: true } },
          likes: { where: { userId: me.user.id }, select: { userId: true } },
          saves: { where: { userId: me.user.id }, select: { userId: true } },
          views: { where: { userId: me.user.id }, select: { userId: true } },
        },
      })
    : [];
  const pinnedSlice = pinnedAll.slice(offset, offset + limit);
  const need = limit - pinnedSlice.length;
  const normal = need > 0
    ? await prisma.study.findMany({
        where: openStudyIds.length ? { ...where, id: { notIn: openStudyIds } } : where,
        orderBy: { createdAt: 'desc' },
        skip: Math.max(0, offset - pinnedAll.length),
        take: need,
        include: {
          author: { select: { name: true, cargo: true, avatar: true, department: true } },
          attachments: true,
          _count: { select: { likes: true, comments: true, views: true } },
          likes: { where: { userId: me.user.id }, select: { userId: true } },
          saves: { where: { userId: me.user.id }, select: { userId: true } },
          views: { where: { userId: me.user.id }, select: { userId: true } },
        },
      })
    : [];
  const rows = [...pinnedSlice, ...normal];

  const openSet = new Set(openStudyIds);
  const studies = rows.map((s) => ({
    id: s.id,
    feed: s.feed,
    excludedDepartments: s.excludedDepartments,
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
    openQuestion: openSet.has(s.id),
    openAskers: askersByStudy.get(s.id) ?? [],
    attachments: s.attachments.map((a) => ({ kind: a.kind, name: a.name, meta: a.meta, url: a.url })),
  }));
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
    authorId: s.authorId,
    excludedDepartments: s.excludedDepartments,
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

/**
 * Perguntas em ABERTO (não respondidas) nas publicações que o usuário acessa —
 * visão AO VIVO (a partir da tabela de comentários, não das notificações), então
 * inclui a pergunta feita pelo próprio consultor e independe de "quem foi avisado".
 * Uma pergunta está aberta se é mais nova que a última resposta de consultor no
 * estudo. Só interessa a quem responde (consultor/diretoria) → [] para clientes.
 */
export interface OpenQuestion {
  commentId: string; studyId: string; feed: string; studyTitle: string;
  author: { name: string; avatar: string | null }; text: string; createdAt: string;
}
export async function listOpenQuestions(me: CurrentUser): Promise<OpenQuestion[]> {
  if (!me.canConsultor) return [];
  const feeds = me.canGestao ? ['estudos', 'gestao'] : ['estudos'];
  const questions = await prisma.comment.findMany({
    where: { isQuestion: true, study: { feed: { in: feeds } } },
    select: {
      id: true, studyId: true, text: true, createdAt: true,
      author: { select: { name: true, avatar: true } },
      study: { select: { title: true, feed: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!questions.length) return [];
  const studyIds = [...new Set(questions.map((q) => q.studyId))];
  const replies = await prisma.comment.groupBy({
    by: ['studyId'],
    where: { studyId: { in: studyIds }, role: 'consultor' },
    _max: { createdAt: true },
  });
  const lastReply = new Map(replies.map((r) => [r.studyId, r._max.createdAt?.getTime() ?? 0]));
  return questions
    .filter((q) => q.createdAt.getTime() > (lastReply.get(q.studyId) ?? 0))
    .map((q) => ({
      commentId: q.id, studyId: q.studyId, feed: q.study.feed, studyTitle: q.study.title,
      author: { name: q.author.name, avatar: q.author.avatar }, text: q.text, createdAt: q.createdAt.toISOString(),
    }));
}

export async function counts(me: CurrentUser) {
  const [openTickets, saved, unread, unseenTickets, openQs] = await Promise.all([
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
    listOpenQuestions(me),
  ]);
  const openQEstudos = openQs.filter((q) => q.feed !== 'gestao').length;
  const openQGestao = openQs.filter((q) => q.feed === 'gestao').length;
  return { openTickets, unseenTickets, saved, unread, openQEstudos, openQGestao };
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
  // Foto do autor (badge no inbox): resolvida pelo comentário referenciado. Se o
  // comentário foi excluído (não deveria — apagamos as notificações junto), cai nas iniciais.
  const cids = ns.map((n) => n.commentId).filter((x): x is string => !!x);
  const authors = cids.length
    ? await prisma.comment.findMany({ where: { id: { in: cids } }, select: { id: true, author: { select: { avatar: true } } } })
    : [];
  const avatarByComment = new Map(authors.map((c) => [c.id, c.author.avatar]));
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
      authorAvatar: n.commentId ? (avatarByComment.get(n.commentId) ?? null) : null,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}
