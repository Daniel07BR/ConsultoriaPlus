'use client';
// Estado compartilhado do Consultoria Plus.
// Fase 1: concentra estado/efeitos/handlers. Fase 3: navegação por ROTAS reais
// (App Router) — `view` deriva do pathname e a navegação usa router.push; a carga
// de dados de cada tela acontece por efeito ao mudar de rota.
import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getJSON, postJSON } from '@/lib/client';
import { catColor, linkKind, linkLabel } from '@/lib/present';
import { pathForView, viewFromPath } from '@/lib/url';
import { ticketSig } from '@/lib/ticketSig';
import type { VideoInput } from './VideoForm';
import type {
  Acting, Me, StudyCard, StudyDetailT, TicketCard, TicketDetailT,
  ViewsPayload, AuditItemT, ReadReceiptT, TicketRefT, NotifT, OpenQuestionT, VideoT, CategoryT,
} from '@/lib/types';

const PAGE_NOTIF = 20; // tamanho da página de notificações
const PAGE_STUDIES = 12; // itens por página no feed de estudos/gestão
const PAGE_HISTORY = 15; // itens por página no histórico de chamados

// Estado inicial (e reset) do formulário de publicar. `excludedDepts` só é usado no
// Feed de Gestão (departamentos ocultos da publicação).
function blankCompose() {
  return { title: '', category: '', body: '', linkInput: '', coverImage: null as string | null, links: [] as { url: string }[], excludedDepts: [] as string[] };
}

function useAppState() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { view, routeId } = viewFromPath(pathname);
  // Feed corrente derivado da rota: 'gestao' nas telas de gestão, senão 'estudos'.
  const feed: 'estudos' | 'gestao' = (view === 'gestao' || view === 'gestaoStudy' || view === 'gestaoCompose') ? 'gestao' : 'estudos';

  const [me, setMe] = useState<Me | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [nav, setNav] = useState<'sidebar' | 'top'>('sidebar');
  const [acting, setActing] = useState<Acting>('consultor');

  // Preferências persistidas (tema + posição da barra de navegação). A leitura roda
  // num efeito de montagem (não no init do useState) p/ não divergir do HTML do SSR.
  // Como a app só renderiza a casca depois que `me` carrega (fetch assíncrono), o
  // valor salvo já está aplicado antes da primeira pintura real — sem "piscar".
  const prefsLoaded = useRef(false);
  useEffect(() => {
    try {
      const t = localStorage.getItem('cp.theme');
      if (t === 'dark' || t === 'light') setTheme(t);
      const n = localStorage.getItem('cp.nav');
      if (n === 'top' || n === 'sidebar') setNav(n);
    } catch { /* localStorage indisponível — segue com o padrão */ }
    prefsLoaded.current = true;
  }, []);
  useEffect(() => { if (prefsLoaded.current) { try { localStorage.setItem('cp.theme', theme); } catch {} } }, [theme]);
  useEffect(() => { if (prefsLoaded.current) { try { localStorage.setItem('cp.nav', nav); } catch {} } }, [nav]);

  const [studies, setStudies] = useState<StudyCard[]>([]);
  const [studiesTotal, setStudiesTotal] = useState(0);
  const [activeStudy, setActiveStudy] = useState<StudyDetailT | null>(null);
  const [tickets, setTickets] = useState<TicketCard[]>([]);
  const [activeTicket, setActiveTicket] = useState<TicketDetailT | null>(null);
  const [notifications, setNotifications] = useState<NotifT[]>([]);
  const [notifTotal, setNotifTotal] = useState(0);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestionT[]>([]);
  const [viewsModal, setViewsModal] = useState<{ studyId: string; title: string; data: ViewsPayload | null } | null>(null);
  const [auditModal, setAuditModal] = useState<{ number: number; items: AuditItemT[] | null } | null>(null);
  const [readsModal, setReadsModal] = useState<{ preview: string; items: ReadReceiptT[] } | null>(null);
  const [editingTicket, setEditingTicket] = useState<{ subject: string } | null>(null);
  const [editRef, setEditRef] = useState<{ id: string; number: number; subject: string } | null>(null);
  // Refs com o estado de edição mais recente — lidos dentro do polling sem recriar timers.
  const editingMessageRef = useRef<{ id: string; text: string } | null>(null);
  const editingTicketRef = useRef<{ subject: string } | null>(null);
  const notifCountRef = useRef(0);
  const studiesCountRef = useRef(0);

  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ticketFilter, setTicketFilter] = useState('todos');
  const [ticketTab, setTicketTab] = useState<'meus' | 'historico'>('meus');
  const [historyTickets, setHistoryTickets] = useState<TicketCard[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [hist, setHist] = useState({ q: '', requester: '', from: '', to: '' });
  const [closing, setClosing] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [videos, setVideos] = useState<VideoT[]>([]);
  const [videoTab, setVideoTab] = useState<'treinamento' | 'sugerido'>('treinamento');
  const [videoFormOpen, setVideoFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoInput | undefined>(undefined);
  const [syncingVideos, setSyncingVideos] = useState(false);

  const [compose, setCompose] = useState(blankCompose());
  const [coverUploading, setCoverUploading] = useState(false);
  const [gestaoCategories, setGestaoCategories] = useState<CategoryT[]>([]); // categorias próprias do Feed de Gestão
  const [feedDepartments, setFeedDepartments] = useState<{ name: string; count: number }[]>([]); // deptos (toggles de audiência) do feed atual
  const [feedDefaultExcluded, setFeedDefaultExcluded] = useState<string[]>([]); // deptos desativados por padrão (estudos)
  const [embed, setEmbed] = useState<{ url: string; kind: string; title: string } | null>(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [editingStudyId, setEditingStudyId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string; text: string } | null>(null);
  const [newTicket, setNewTicket] = useState({ subject: '', category: '', body: '', referenceId: '' });
  const [refQuery, setRefQuery] = useState('');
  const [refResults, setRefResults] = useState<TicketRefT[]>([]);
  const [refSelected, setRefSelected] = useState<TicketRefT | null>(null);
  const [refSearching, setRefSearching] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentIsQuestion, setCommentIsQuestion] = useState(false);
  const [ticketDraft, setTicketDraft] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const ticketInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashMsg = useCallback((m: string) => {
    setFlash(m);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2400);
  }, []);

  const scrollTop = () => requestAnimationFrame(() => { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {} });

  const refreshMe = useCallback(async () => {
    const m = await getJSON<Me>('/api/me');
    setMe(m);
    return m;
  }, []);

  const loadStudies = useCallback(async (opts?: { saved?: boolean; filter?: string; search?: string; from?: string; to?: string; feed?: string; offset?: number }) => {
    const p = new URLSearchParams();
    if (opts?.saved) p.set('saved', 'true');
    if (opts?.filter && opts.filter !== 'Todos') p.set('filter', opts.filter);
    if (opts?.search) p.set('search', opts.search);
    if (opts?.from) p.set('from', opts.from);
    if (opts?.to) p.set('to', opts.to);
    if (opts?.feed === 'gestao') p.set('feed', 'gestao');
    const off = opts?.offset ?? 0;
    p.set('limit', String(PAGE_STUDIES));
    p.set('offset', String(off));
    const d = await getJSON<{ studies: StudyCard[]; total: number }>(`/api/studies?${p}`);
    setStudies((prev) => (off > 0 ? [...prev, ...d.studies] : d.studies)); // offset>0 anexa (carregar mais)
    setStudiesTotal(d.total);
  }, []);
  const loadMoreStudies = () => (
    view === 'saved'
      ? loadStudies({ saved: true, from: dateFrom, to: dateTo, offset: studies.length })
      : loadStudies({ filter, search, feed, from: dateFrom, to: dateTo, offset: studies.length })
  );

  const loadGestaoCategories = useCallback(async () => {
    const d = await getJSON<{ categories: CategoryT[] }>('/api/categories?feed=gestao');
    setGestaoCategories(d.categories);
  }, []);

  // Departamentos (toggles de audiência) do feed corrente + os desativados por padrão.
  const loadFeedDepartments = useCallback(async (f: string) => {
    try {
      const dep = await getJSON<{ departments: { name: string; count: number }[]; defaultExcluded: string[] }>(`/api/feed-departments?feed=${f === 'gestao' ? 'gestao' : 'estudos'}`);
      setFeedDepartments(dep.departments);
      setFeedDefaultExcluded(dep.defaultExcluded || []);
    } catch { /* sem permissão/erro: mantém a lista atual */ }
  }, []);

  const loadTickets = useCallback(async (status: string) => {
    const d = await getJSON<{ tickets: TicketCard[] }>(`/api/tickets?status=${status}`);
    setTickets(d.tickets);
  }, []);

  const loadHistory = useCallback(async (h: { q: string; requester: string; from: string; to: string }, offset = 0) => {
    const p = new URLSearchParams();
    if (h.q) p.set('q', h.q);
    if (h.requester) p.set('requester', h.requester);
    if (h.from) p.set('from', h.from);
    if (h.to) p.set('to', h.to);
    p.set('limit', String(PAGE_HISTORY));
    p.set('offset', String(offset));
    const d = await getJSON<{ tickets: TicketCard[]; total: number }>(`/api/tickets/history?${p}`);
    setHistoryTickets((prev) => (offset > 0 ? [...prev, ...d.tickets] : d.tickets));
    setHistoryTotal(d.total);
  }, []);
  const loadMoreHistory = () => loadHistory(hist, historyTickets.length);

  const loadNotifications = useCallback(async () => {
    const d = await getJSON<{ notifications: NotifT[]; total: number }>(`/api/notifications?limit=${PAGE_NOTIF}&offset=0`);
    setNotifications(d.notifications);
    setNotifTotal(d.total);
  }, []);
  const loadMoreNotifications = async () => {
    const d = await getJSON<{ notifications: NotifT[]; total: number }>(`/api/notifications?limit=${PAGE_NOTIF}&offset=${notifications.length}`);
    setNotifications((prev) => [...prev, ...d.notifications]);
    setNotifTotal(d.total);
  };
  // Perguntas em aberto (ao vivo) — seção destacada no topo do inbox, só p/ consultor.
  const loadOpenQuestions = useCallback(async () => {
    const d = await getJSON<{ items: OpenQuestionT[] }>('/api/open-questions');
    setOpenQuestions(d.items);
  }, []);

  const loadVideos = useCallback(async (tab: string) => {
    const d = await getJSON<{ videos: VideoT[] }>(`/api/videos?tab=${tab}`);
    setVideos(d.videos);
  }, []);

  // Marca as mensagens do chamado como lidas (recibo "visto") — fire-and-forget.
  const markTicketSeen = (id: string) => { try { void postJSON(`/api/tickets/${id}/seen`); } catch { /* silencioso */ } };

  // init — carrega o usuário e a visão padrão.
  useEffect(() => {
    (async () => {
      const m = await refreshMe();
      setActing(m.defaultView);
    })();
  }, [refreshMe]);

  // Identidade estável do usuário. O objeto `me` é recriado a cada refreshMe (polling
  // de 10s), mas o id NÃO muda — então usamos `uid` como dep dos efeitos de carga p/
  // eles não re-dispararem à toa (senão o chamado "volta ao topo" e o painel de edição
  // fecha sozinho a cada 10s).
  const uid = me?.user.id ?? null;

  // Carrega o detalhe (estudo/chamado) ao entrar na rota /estudos/:id ou /chamados/:id
  // — cobre clique, deep-link e F5. Substitui o antigo restore()/openStudy/openTicket.
  useEffect(() => {
    if (!uid) return;
    if ((view === 'study' || view === 'gestaoStudy') && routeId) {
      setActiveStudy(null);
      getJSON<{ study: StudyDetailT }>(`/api/studies/${routeId}`)
        // Abrir o estudo já baixou as notificações dele no servidor; refreshMe
        // atualiza o sino/contadores na hora (sem esperar o polling).
        .then((d) => { setActiveStudy(d.study); refreshMe(); })
        .catch(() => router.replace(view === 'gestaoStudy' ? '/gestao' : '/feed'));
    } else if (view === 'ticket' && routeId) {
      setActiveTicket(null); setTicketDraft(''); setEditingTicket(null); setEditRef(null); setRefQuery(''); setRefResults([]);
      getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${routeId}`)
        // Abrir o chamado baixa as notificações (no GET) e marca as mensagens como
        // vistas; espera o "seen" e então atualiza contadores (sino + Chamados).
        .then(async (d) => { setActiveTicket(d.ticket); try { await postJSON(`/api/tickets/${routeId}/seen`); } catch {} refreshMe(); })
        .catch(() => router.replace('/feed'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, routeId, uid]);

  // Carrega listas ao entrar na tela (clique, deep-link, F5). Feed/salvos ficam no
  // efeito de filtro logo abaixo; vídeos/chamados/notificações/perfil aqui.
  useEffect(() => {
    if (!uid) return;
    if (view === 'videos') loadVideos(videoTab);
    else if (view === 'tickets') loadTickets(ticketFilter);
    else if (view === 'notifications' || view === 'profile') { loadNotifications(); if (view === 'notifications') loadOpenQuestions(); }
    // Categorias do Feed de Gestão: carrega ao entrar em qualquer tela de gestão.
    if (feed === 'gestao') loadGestaoCategories();
    // Deptos p/ os toggles de audiência (feed atual): nas telas de feed/publicar.
    if (view === 'feed' || view === 'compose' || view === 'gestao' || view === 'gestaoCompose') loadFeedDepartments(feed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, uid]);

  // recarrega lista quando filtro/busca/período mudam no feed/salvos (e ao entrar neles)
  useEffect(() => {
    if (!uid) return;
    if (view === 'feed') loadStudies({ filter, search, from: dateFrom, to: dateTo });
    if (view === 'gestao') loadStudies({ feed: 'gestao', filter, search, from: dateFrom, to: dateTo });
    if (view === 'saved') loadStudies({ saved: true, from: dateFrom, to: dateTo });
  }, [filter, search, dateFrom, dateTo, view, uid, loadStudies]);

  editingMessageRef.current = editingMessage;
  editingTicketRef.current = editingTicket;
  notifCountRef.current = notifications.length;
  studiesCountRef.current = studies.length;

  // ---- polling em tempo real ----------------------------------------
  // Atualiza notificações/contadores sempre (10s); feed quando está no feed
  // (20s); estudo aberto e chamado aberto a cada 8s. Pausa enquanto a aba está
  // oculta — `visibilitychange`. Sem F5: novo estudo, nova pergunta, nova
  // resposta, novo alerta aparecem sozinhos.
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    const timers: ReturnType<typeof setInterval>[] = [];
    const safe = (fn: () => Promise<unknown> | void) => () => {
      if (cancelled || typeof document !== 'undefined' && document.hidden) return;
      try { void fn(); } catch { /* silencioso — o próximo tick tenta de novo */ }
    };
    // Sino + contadores (sempre que estiver na app)
    timers.push(setInterval(safe(refreshMe), 10000));
    // Feed/salvos/gestão — só atualiza a 1ª página (não reseta quem clicou "carregar mais").
    if (view === 'feed') timers.push(setInterval(safe(() => { if (studiesCountRef.current <= PAGE_STUDIES) loadStudies({ filter, search, from: dateFrom, to: dateTo }); }), 20000));
    if (view === 'gestao') timers.push(setInterval(safe(() => { if (studiesCountRef.current <= PAGE_STUDIES) loadStudies({ feed: 'gestao', filter, search, from: dateFrom, to: dateTo }); }), 20000));
    if (view === 'saved') timers.push(setInterval(safe(() => { if (studiesCountRef.current <= PAGE_STUDIES) loadStudies({ saved: true, from: dateFrom, to: dateTo }); }), 20000));
    // Estudo aberto (estudos ou gestão) → comentários novos
    if ((view === 'study' || view === 'gestaoStudy') && activeStudy?.id) {
      const id = activeStudy.id;
      timers.push(setInterval(safe(async () => {
        const d = await getJSON<{ study: StudyDetailT }>(`/api/studies/${id}`);
        // só atualiza se mudou pra não fazer "salto" em quem está escrevendo
        setActiveStudy((cur) => (cur && cur.id === id && cur.comments.length !== d.study.comments.length ? d.study : cur));
      }), 8000));
    }
    // Chamado aberto → mensagens novas, edições e exclusões (sem F5).
    if (view === 'ticket' && activeTicket?.id) {
      const id = activeTicket.id;
      timers.push(setInterval(safe(async () => {
        // Não sobrescreve enquanto alguém está digitando uma edição (mensagem ou título).
        if (editingMessageRef.current || editingTicketRef.current) return;
        const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${id}`);
        setActiveTicket((cur) => (cur && cur.id === id && ticketSig(cur) !== ticketSig(d.ticket) ? d.ticket : cur));
        markTicketSeen(id); // confirma leitura de mensagens que chegaram enquanto o chamado está aberto
      }), 8000));
    }
    // Lista de notificações se está aberta
    // Atualiza a lista só quando está na 1ª página (não reseta quem clicou em "Carregar mais").
    if (view === 'notifications') timers.push(setInterval(safe(() => { loadOpenQuestions(); if (notifCountRef.current <= PAGE_NOTIF) loadNotifications(); }), 12000));
    // Lista de chamados se está aberta
    if (view === 'tickets') timers.push(setInterval(safe(() => loadTickets(ticketFilter)), 15000));
    return () => { cancelled = true; timers.forEach(clearInterval); };
  }, [uid, view, activeStudy?.id, activeTicket?.id, filter, search, dateFrom, dateTo, ticketFilter, refreshMe, loadStudies, loadNotifications, loadOpenQuestions, loadTickets]);

  if (!me) return null;

  const isConsultor = acting === 'consultor';
  // Categorias do feed corrente: gestão tem as próprias; estudos vêm do /api/me.
  const categories = feed === 'gestao' ? gestaoCategories : me.categories;
  const catNames = categories.map((c) => c.name);
  const colorOf = (c: string) => categories.find((x) => x.name === c)?.color || catColor(c);
  const firstCat = catNames[0] || (feed === 'gestao' ? 'Geral' : 'Tributário');

  // ---- navegação (rotas reais) ----
  const resetDrafts = () => { setCommentDraft(''); setCommentIsQuestion(false); setTicketDraft(''); };
  const go = (v: typeof view) => { resetDrafts(); scrollTop(); router.push(pathForView(v)); };
  const goFeed = () => go('feed');
  const goGestao = () => go('gestao');
  const goSaved = () => go('saved');
  const goTickets = () => go('tickets');
  const goNotifications = () => go('notifications');
  const goProfile = () => go('profile');
  const goVideos = () => go('videos');

  // Abre o detalhe na rota do feed correto (carrega o estudo/publicação). Aceita o
  // feed do próprio card; por padrão usa o feed da tela atual.
  const openStudy = (id: string, studyFeed: string = feed, anchor?: string | null) => {
    const base = studyFeed === 'gestao' ? `/gestao/${id}` : `/estudos/${id}`;
    // Com âncora (clique numa notificação de comentário): NÃO sobe ao topo; o
    // StudyView rola até `#c-<commentId>` e o destaca ao carregar os comentários.
    if (anchor) { router.push(`${base}#c-${anchor}`); }
    else { scrollTop(); router.push(base); }
  };
  const openTicket = (id: string) => { scrollTop(); router.push(`/chamados/${id}`); };

  // ---- ações ----
  const toggleLike = async (id: string) => {
    const r = await postJSON<{ liked: boolean; likes: number }>(`/api/studies/${id}/like`);
    setStudies((ss) => ss.map((s) => (s.id === id ? { ...s, liked: r.liked, likes: r.likes } : s)));
    setActiveStudy((s) => (s && s.id === id ? { ...s, liked: r.liked, likes: r.likes } : s));
  };
  // Joinha = "vi este estudo". Marca, atualiza contador e abre o modal com a lista.
  const openViews = async (id: string, title: string) => {
    setViewsModal({ studyId: id, title, data: null });
    try {
      const r = await postJSON<{ viewed: boolean; total: number }>(`/api/studies/${id}/view`);
      setStudies((ss) => ss.map((s) => (s.id === id ? { ...s, viewed: true, views: r.total } : s)));
      setActiveStudy((s) => (s && s.id === id ? { ...s, viewed: true, views: r.total } : s));
    } catch { /* segue listando mesmo se a marcação falhou */ }
    const data = await getJSON<ViewsPayload>(`/api/studies/${id}/views`);
    setViewsModal((m) => (m && m.studyId === id ? { ...m, data } : m));
  };
  const toggleSave = async (id: string) => {
    const r = await postJSON<{ saved: boolean }>(`/api/studies/${id}/save`);
    setStudies((ss) => ss.map((s) => (s.id === id ? { ...s, saved: r.saved } : s)));
    setActiveStudy((s) => (s && s.id === id ? { ...s, saved: r.saved } : s));
    flashMsg(r.saved ? 'Estudo salvo' : 'Removido dos salvos');
    refreshMe();
    if (view === 'saved') loadStudies({ saved: true });
  };
  const submitComment = async () => {
    const text = commentDraft.trim();
    if (!text || !activeStudy) return;
    await postJSON(`/api/studies/${activeStudy.id}/comments`, { text, isQuestion: commentIsQuestion, actingRole: acting });
    flashMsg(commentIsQuestion ? 'Pergunta publicada' : 'Comentário publicado');
    setCommentDraft(''); setCommentIsQuestion(false);
    const d = await getJSON<{ study: StudyDetailT }>(`/api/studies/${activeStudy.id}`);
    setActiveStudy(d.study);
  };
  const publishStudy = async () => {
    const isGestao = feed === 'gestao';
    if (!compose.title.trim()) { flashMsg(isGestao ? 'Adicione um título à publicação' : 'Adicione um título ao estudo'); return; }
    const payload = {
      title: compose.title,
      category: compose.category || firstCat,
      body: compose.body,
      coverImage: compose.coverImage,
      links: compose.links,
      feed,
      // Audiência por departamento (só Feed de Gestão): deptos desmarcados = ocultos.
      ...(isGestao ? { excludedDepartments: compose.excludedDepts } : {}),
    };
    if (editingStudyId) {
      await fetch(`/api/studies/${editingStudyId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      flashMsg(isGestao ? 'Publicação atualizada' : 'Estudo atualizado');
    } else {
      await postJSON('/api/studies', payload);
      flashMsg(isGestao ? 'Publicação enviada' : 'Estudo publicado com sucesso');
    }
    const wasEditing = editingStudyId;
    setEditingStudyId(null);
    setCompose(blankCompose());
    if (wasEditing) openStudy(wasEditing, feed);
    else { setFilter('Todos'); setSearch(''); loadStudies({ filter: 'Todos', search: '', feed }); go(isGestao ? 'gestao' : 'feed'); }
  };

  const startEditStudy = (s: StudyDetailT) => {
    setEditingStudyId(s.id);
    setCompose({
      title: s.title,
      category: s.category,
      body: s.body.join('\n\n'),
      linkInput: '',
      coverImage: s.coverImage,
      links: s.attachments.filter((a) => a.url).map((a) => ({ url: a.url as string })),
      excludedDepts: s.excludedDepartments ?? [],
    });
    go(s.feed === 'gestao' ? 'gestaoCompose' : 'compose');
  };
  const deleteStudy = async (id: string) => {
    const isGestao = feed === 'gestao';
    if (!confirm(isGestao ? 'Excluir esta publicação? Esta ação não pode ser desfeita.' : 'Excluir este estudo? Esta ação não pode ser desfeita.')) return;
    await fetch(`/api/studies/${id}`, { method: 'DELETE' });
    flashMsg(isGestao ? 'Publicação excluída' : 'Estudo excluído');
    loadStudies({ filter, search, feed }); go(isGestao ? 'gestao' : 'feed');
  };

  const saveComment = async () => {
    if (!editingComment || !activeStudy) return;
    const text = editingComment.text.trim();
    if (!text) return;
    await fetch(`/api/comments/${editingComment.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    setEditingComment(null);
    const d = await getJSON<{ study: StudyDetailT }>(`/api/studies/${activeStudy.id}`);
    setActiveStudy(d.study);
  };
  const deleteComment = async (id: string) => {
    if (!activeStudy || !confirm('Excluir este comentário?')) return;
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    const d = await getJSON<{ study: StudyDetailT }>(`/api/studies/${activeStudy.id}`);
    setActiveStudy(d.study);
    // Atualiza na hora os alertas de "pergunta em aberto" (menu/botão) e o inbox.
    refreshMe();
    loadOpenQuestions();
  };

  const saveMessage = async () => {
    if (!editingMessage || !activeTicket) return;
    const text = editingMessage.text.trim();
    if (!text) return;
    await fetch(`/api/messages/${editingMessage.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    setEditingMessage(null);
    flashMsg('Mensagem editada');
    const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${activeTicket.id}`);
    setActiveTicket(d.ticket);
  };
  const deleteMessage = async (id: string) => {
    if (!activeTicket) return;
    const reason = prompt('Por que esta mensagem está sendo excluída?\nO motivo fica registrado na auditoria.');
    if (reason === null) return; // cancelou
    await fetch(`/api/messages/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reason.trim(), actingRole: acting }) });
    flashMsg('Mensagem excluída');
    const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${activeTicket.id}`);
    setActiveTicket(d.ticket);
  };
  const openAudit = async () => {
    if (!activeTicket) return;
    setAuditModal({ number: activeTicket.number, items: null });
    try {
      const d = await getJSON<{ items: AuditItemT[] }>(`/api/tickets/${activeTicket.id}/audit`);
      setAuditModal((a) => (a ? { ...a, items: d.items } : a));
    } catch { setAuditModal((a) => (a ? { ...a, items: [] } : a)); }
  };

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('feed', feed);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const { dataUri } = await res.json();
      setCompose((c) => ({ ...c, coverImage: dataUri }));
    } catch {
      flashMsg('Falha ao enviar a imagem');
    } finally {
      setCoverUploading(false);
    }
  };

  const addComposeLink = () => {
    const v = compose.linkInput.trim();
    if (!v) return;
    setCompose((c) => ({ ...c, links: [...c.links, { url: v }], linkInput: '' }));
  };

  // categorias (criar/editar/excluir) do feed corrente. Estudos → recarrega via
  // /api/me; gestão → recarrega a lista própria. Permissão checada no servidor.
  const reloadCategories = async () => { if (feed === 'gestao') await loadGestaoCategories(); else await refreshMe(); };
  const createCategory = async (name: string, color: string) => {
    const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color, feed }) });
    if (res.ok) { await reloadCategories(); flashMsg('Categoria criada'); } else { flashMsg('Não foi possível criar (nome repetido?)'); }
  };
  const updateCategory = async (id: string, name: string, color: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color }) });
    if (res.ok) { await reloadCategories(); if (view === 'feed' || view === 'gestao') loadStudies({ filter, search, feed }); flashMsg('Categoria atualizada'); } else { flashMsg('Não foi possível salvar'); }
  };
  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) { await reloadCategories(); flashMsg('Categoria excluída'); } else { const d = await res.json().catch(() => null); flashMsg(d?.inUse ? `Em uso por ${d.inUse} registro(s)` : 'Não foi possível excluir'); }
  };

  const openLink = (url: string) => {
    const kind = linkKind(url);
    if (kind === 'video' || kind === 'drive') setEmbed({ url, kind, title: linkLabel(url) });
    else window.open(url, '_blank', 'noopener');
  };
  const cancelCompose = () => {
    const editing = editingStudyId;
    setEditingStudyId(null);
    setCompose(blankCompose());
    if (editing) openStudy(editing, feed); else go(feed === 'gestao' ? 'gestao' : 'feed');
  };
  const startNewTicket = () => {
    setNewTicket({ subject: '', category: '', body: '', referenceId: '' });
    setRefSelected(null); setRefQuery(''); setRefResults([]);
    go('newticket');
  };
  const searchRefTickets = async (q: string, excludeId?: string) => {
    setRefQuery(q);
    if (!q.trim()) { setRefResults([]); return; }
    setRefSearching(true);
    try {
      const ex = excludeId ? `&exclude=${excludeId}` : '';
      const d = await getJSON<{ tickets: TicketRefT[] }>(`/api/tickets/search?q=${encodeURIComponent(q)}${ex}`);
      setRefResults(d.tickets);
    } catch { setRefResults([]); } finally { setRefSearching(false); }
  };
  const selectRefTicket = (t: TicketRefT | null) => {
    setRefSelected(t);
    setNewTicket((n) => ({ ...n, referenceId: t?.id || '' }));
    setRefResults([]); setRefQuery('');
  };
  // ---- edição do chamado (título + citação) ----
  const startEditTicket = () => {
    if (!activeTicket) return;
    setEditingTicket({ subject: activeTicket.subject });
    setEditRef(activeTicket.reference ? { ...activeTicket.reference } : null);
    setRefQuery(''); setRefResults([]);
  };
  const cancelEditTicket = () => { setEditingTicket(null); setEditRef(null); setRefQuery(''); setRefResults([]); };
  const pickEditRef = (t: TicketRefT) => { setEditRef({ id: t.id, number: t.number, subject: t.subject }); setRefResults([]); setRefQuery(''); };
  const saveTicketEdit = async () => {
    if (!activeTicket || !editingTicket) return;
    const subject = editingTicket.subject.trim();
    if (!subject) { flashMsg('Informe o título do chamado'); return; }
    await fetch(`/api/tickets/${activeTicket.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, referenceId: editRef?.id ?? null }) });
    cancelEditTicket();
    flashMsg('Chamado atualizado');
    const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${activeTicket.id}`);
    setActiveTicket(d.ticket);
    if (view === 'tickets') loadTickets(ticketFilter);
  };
  // Assumir / liberar o chamado (consultor responsável). Reaponta quem está atendendo.
  const assumirTicket = async (release = false) => {
    if (!activeTicket) return;
    await postJSON(`/api/tickets/${activeTicket.id}/assign`, { release, actingRole: acting });
    flashMsg(release ? 'Chamado liberado' : 'Você assumiu o chamado');
    const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${activeTicket.id}`);
    setActiveTicket(d.ticket);
    if (view === 'tickets') loadTickets(ticketFilter);
  };
  // Excluir chamado por completo (só admin). Pede confirmação; remove do estado local.
  const deleteTicket = async (id: string, number: number, subject: string) => {
    if (!me.isAdmin) return;
    if (!window.confirm(`Excluir o chamado #${number} "${subject}"?\n\nA ação é permanente e remove as mensagens, notificações e o histórico deste chamado.`)) return;
    const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
    if (!res.ok) { flashMsg('Não foi possível excluir o chamado'); return; }
    flashMsg(`Chamado #${number} excluído`);
    setTickets((cur) => cur.filter((x) => x.id !== id));
    setHistoryTickets((cur) => cur.filter((x) => x.id !== id));
    if (activeTicket?.id === id) goTickets(); // estava aberto → volta à lista
    else if (view === 'tickets') loadTickets(ticketFilter);
    refreshMe();
  };
  const submitTicket = async () => {
    if (!newTicket.subject.trim()) { flashMsg('Informe o assunto do chamado'); return; }
    const r = await postJSON<{ id: string }>('/api/tickets', { ...newTicket, category: newTicket.category || firstCat });
    setNewTicket({ subject: '', category: '', body: '', referenceId: '' });
    setRefSelected(null); setRefQuery(''); setRefResults([]);
    flashMsg('Chamado aberto');
    refreshMe();
    openTicket(r.id);
  };
  const sendTicketReply = async () => {
    const text = ticketDraft.trim();
    if (!text || !activeTicket) return;
    await postJSON(`/api/tickets/${activeTicket.id}/messages`, { text, actingRole: acting });
    setTicketDraft('');
    flashMsg('Mensagem enviada');
    // Responder implica ter lido a conversa: marca as mensagens da outra ponta como
    // "visto" de forma garantida (não depende do timing do polling nem de cliente
    // atualizado). Espera concluir antes de recarregar p/ o recibo já vir no reload.
    try { await postJSON(`/api/tickets/${activeTicket.id}/seen`); } catch { /* silencioso */ }
    const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${activeTicket.id}`);
    setActiveTicket(d.ticket);
    refreshMe();
  };
  const closeTicket = async (rating: number) => {
    if (!activeTicket) return;
    await postJSON(`/api/tickets/${activeTicket.id}/close`, { rating });
    setClosing(false); setRatingHover(0);
    flashMsg('Chamado fechado e avaliado. Obrigado!');
    const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${activeTicket.id}`);
    setActiveTicket(d.ticket);
    refreshMe();
  };

  const saveVideo = async (v: VideoInput) => {
    if (v.id) {
      await fetch(`/api/videos/${v.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) });
      flashMsg('Vídeo atualizado');
    } else {
      await postJSON('/api/videos', v);
      flashMsg('Vídeo adicionado');
    }
    setVideoFormOpen(false); setEditingVideo(undefined);
    await loadVideos(videoTab);
  };
  const deleteVideo = async (id: string) => {
    if (!confirm('Excluir este vídeo?')) return;
    await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    flashMsg('Vídeo excluído');
    await loadVideos(videoTab);
  };
  const playVideo = (v: VideoT) => setEmbed({ url: v.url, kind: linkKind(v.url), title: v.title });
  const toggleWatched = async (v: VideoT) => {
    const next = !v.watched;
    setVideos((vs) => vs.map((x) => (x.id === v.id ? { ...x, watched: next } : x))); // otimista
    const r = await fetch(`/api/videos/${v.id}/watched`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ watched: next }) });
    if (!r.ok) { setVideos((vs) => vs.map((x) => (x.id === v.id ? { ...x, watched: !next } : x))); flashMsg('Não foi possível atualizar'); return; }
    const d = await r.json().catch(() => null);
    flashMsg(next ? (d?.synced ? 'Marcado como assistido (registrado no ClassRoom)' : 'Marcado como assistido') : 'Marcação removida');
  };
  const reclassifyVideo = async (v: VideoT, tab: 'treinamento' | 'sugerido') => {
    await fetch(`/api/videos/${v.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tab }) });
    flashMsg(tab === 'treinamento' ? 'Movido para Treinamentos' : 'Movido para Vídeos sugeridos');
    await loadVideos(videoTab);
  };
  const syncVideos = async () => {
    setSyncingVideos(true);
    try {
      const r = await fetch('/api/videos/sync', { method: 'POST' });
      const d = await r.json().catch(() => null);
      if (!r.ok) { flashMsg(d?.error || 'Falha ao sincronizar'); return; }
      flashMsg(`Sincronizado: ${d.created} novo(s), ${d.updated} atualizado(s)${d.deleted ? `, ${d.deleted} removido(s)` : ''}`);
      await loadVideos(videoTab);
    } finally {
      setSyncingVideos(false);
    }
  };

  const openNotif = async (n: NotifT) => {
    if (!n.read) { await postJSON(`/api/notifications/${n.id}/read`); setNotifications((ns) => ns.map((x) => (x.id === n.id ? { ...x, read: true } : x))); refreshMe(); }
    if ((n.targetType === 'study' || n.targetType === 'gestaoStudy') && n.targetId) {
      openStudy(n.targetId, n.targetType === 'gestaoStudy' ? 'gestao' : 'estudos', n.commentId);
    }
  };
  const markAllRead = async () => { await postJSON('/api/notifications/read-all'); setNotifications((ns) => ns.map((x) => ({ ...x, read: true }))); flashMsg('Todas marcadas como lidas'); refreshMe(); };
  const logout = async () => { await postJSON('/api/logout'); window.location.href = '/login'; };
  const onPrimary = () => {
    // No Feed de Gestão todos publicam; fora dele segue a regra do feed de estudos.
    if (feed === 'gestao') {
      setEditingStudyId(null);
      setCompose(blankCompose());
      go('gestaoCompose');
    } else if (isConsultor) {
      setEditingStudyId(null);
      // Feed de estudos: alguns setores já vêm DESATIVADOS por padrão (o consultor ativa se quiser).
      setCompose({ ...blankCompose(), excludedDepts: feedDefaultExcluded });
      go('compose');
    } else startNewTicket();
  };

  const openTicketCount = me.counts.openTickets;
  const unseenTicketCount = me.counts.unseenTickets;
  const unreadCount = me.counts.unread;
  const savedCount = me.counts.saved;
  const openQEstudos = me.counts.openQEstudos;
  const openQGestao = me.counts.openQGestao;

  // "Marcar todos como vistos": zera os alertas de chamado de uma vez. Marca como
  // lidas todas as mensagens (da outra ponta) dos chamados acessíveis e recarrega
  // contadores + a lista aberta.
  const markAllTicketsSeen = async () => {
    await postJSON('/api/tickets/seen-all');
    flashMsg('Alertas de chamado limpos');
    await refreshMe();
    if (view === 'tickets') loadTickets(ticketFilter);
  };

  return {
    // navegação derivada de rota
    view, feed,
    // estado base + setters
    me, theme, setTheme, nav, setNav, acting, setActing,
    studies, setStudies, studiesTotal, activeStudy, setActiveStudy, tickets, setTickets, activeTicket, setActiveTicket,
    notifications, setNotifications, notifTotal, setNotifTotal, openQuestions,
    viewsModal, setViewsModal, auditModal, setAuditModal, readsModal, setReadsModal,
    editingTicket, setEditingTicket, editRef, setEditRef,
    filter, setFilter, search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo,
    ticketFilter, setTicketFilter, ticketTab, setTicketTab, historyTickets, setHistoryTickets, historyTotal, hist, setHist,
    closing, setClosing, ratingHover, setRatingHover,
    videos, setVideos, videoTab, setVideoTab, videoFormOpen, setVideoFormOpen, editingVideo, setEditingVideo, syncingVideos, setSyncingVideos,
    compose, setCompose, coverUploading, setCoverUploading, embed, setEmbed, catManagerOpen, setCatManagerOpen, feedDepartments,
    editingStudyId, setEditingStudyId, editingComment, setEditingComment, editingMessage, setEditingMessage,
    newTicket, setNewTicket, refQuery, setRefQuery, refResults, setRefResults, refSelected, setRefSelected, refSearching, setRefSearching,
    commentDraft, setCommentDraft, commentIsQuestion, setCommentIsQuestion, ticketDraft, setTicketDraft,
    commentInputRef, ticketInputRef, flash,
    // derivados
    isConsultor, categories, catNames, colorOf, firstCat, openTicketCount, unseenTicketCount, unreadCount, savedCount, openQEstudos, openQGestao,
    // loaders
    refreshMe, loadStudies, loadMoreStudies, loadTickets, loadHistory, loadMoreHistory, loadNotifications, loadMoreNotifications, loadOpenQuestions, loadVideos, flashMsg,
    // handlers
    go, goFeed, goGestao, goSaved, goTickets, goNotifications, goProfile, goVideos, openStudy, openTicket,
    toggleLike, openViews, toggleSave, submitComment, publishStudy, startEditStudy, deleteStudy,
    saveComment, deleteComment, saveMessage, deleteMessage, openAudit, uploadCover, addComposeLink,
    createCategory, updateCategory, deleteCategory, openLink, cancelCompose, startNewTicket,
    searchRefTickets, selectRefTicket, startEditTicket, cancelEditTicket, pickEditRef, saveTicketEdit,
    submitTicket, sendTicketReply, closeTicket, assumirTicket, deleteTicket, saveVideo, deleteVideo, playVideo, toggleWatched,
    reclassifyVideo, syncVideos, openNotif, markAllRead, markAllTicketsSeen, logout, onPrimary,
  };
}

type AppContextValue = NonNullable<ReturnType<typeof useAppState>>;

const Ctx = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp deve ser usado dentro de <AppProvider>');
  return c;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const value = useAppState();
  if (!value) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg3)' }}>Carregando…</div>;
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
