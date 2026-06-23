'use client';
// Estado compartilhado do Consultoria Plus (Fase 1 do refactor).
// Concentra TODO o estado, efeitos (polling, url-sync, reload-por-filtro),
// loaders e handlers que antes viviam em AppClient. As telas e a casca
// (AppShell) consomem isto via useApp(). Comportamento idêntico ao anterior.
import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getJSON, postJSON } from '@/lib/client';
import { catColor, linkKind, linkLabel } from '@/lib/present';
import { urlForView, parseUrl } from '@/lib/url';
import { ticketSig } from '@/lib/ticketSig';
import type { VideoInput } from './VideoForm';
import type {
  View, Acting, Me, StudyCard, StudyDetailT, TicketCard, TicketDetailT,
  ViewsPayload, AuditItemT, ReadReceiptT, TicketRefT, NotifT, VideoT,
} from '@/lib/types';

const PAGE_NOTIF = 20; // tamanho da página de notificações

function useAppState() {
  const [me, setMe] = useState<Me | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [nav, setNav] = useState<'sidebar' | 'top'>('sidebar');
  const [acting, setActing] = useState<Acting>('consultor');
  const [view, setView] = useState<View>('feed');

  const [studies, setStudies] = useState<StudyCard[]>([]);
  const [activeStudy, setActiveStudy] = useState<StudyDetailT | null>(null);
  const [tickets, setTickets] = useState<TicketCard[]>([]);
  const [activeTicket, setActiveTicket] = useState<TicketDetailT | null>(null);
  const [notifications, setNotifications] = useState<NotifT[]>([]);
  const [notifTotal, setNotifTotal] = useState(0);
  const [viewsModal, setViewsModal] = useState<{ studyId: string; title: string; data: ViewsPayload | null } | null>(null);
  const [auditModal, setAuditModal] = useState<{ number: number; items: AuditItemT[] | null } | null>(null);
  const [readsModal, setReadsModal] = useState<{ preview: string; items: ReadReceiptT[] } | null>(null);
  const [editingTicket, setEditingTicket] = useState<{ subject: string } | null>(null);
  const [editRef, setEditRef] = useState<{ id: string; number: number; subject: string } | null>(null);
  // Refs com o estado de edição mais recente — lidos dentro do polling sem recriar timers.
  const editingMessageRef = useRef<{ id: string; text: string } | null>(null);
  const editingTicketRef = useRef<{ subject: string } | null>(null);
  const notifCountRef = useRef(0);

  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ticketFilter, setTicketFilter] = useState('todos');
  const [ticketTab, setTicketTab] = useState<'meus' | 'historico'>('meus');
  const [historyTickets, setHistoryTickets] = useState<TicketCard[]>([]);
  const [hist, setHist] = useState({ q: '', requester: '', from: '', to: '' });
  const [closing, setClosing] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [videos, setVideos] = useState<VideoT[]>([]);
  const [videoTab, setVideoTab] = useState<'treinamento' | 'sugerido'>('treinamento');
  const [videoFormOpen, setVideoFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoInput | undefined>(undefined);
  const [syncingVideos, setSyncingVideos] = useState(false);

  const [compose, setCompose] = useState({ title: '', category: '', body: '', linkInput: '', coverImage: null as string | null, links: [] as { url: string }[] });
  const [coverUploading, setCoverUploading] = useState(false);
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

  const loadStudies = useCallback(async (opts?: { saved?: boolean; filter?: string; search?: string; from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (opts?.saved) p.set('saved', 'true');
    if (opts?.filter && opts.filter !== 'Todos') p.set('filter', opts.filter);
    if (opts?.search) p.set('search', opts.search);
    if (opts?.from) p.set('from', opts.from);
    if (opts?.to) p.set('to', opts.to);
    const d = await getJSON<{ studies: StudyCard[] }>(`/api/studies?${p}`);
    setStudies(d.studies);
  }, []);

  const loadTickets = useCallback(async (status: string) => {
    const d = await getJSON<{ tickets: TicketCard[] }>(`/api/tickets?status=${status}`);
    setTickets(d.tickets);
  }, []);

  const loadHistory = useCallback(async (h: { q: string; requester: string; from: string; to: string }) => {
    const p = new URLSearchParams();
    if (h.q) p.set('q', h.q);
    if (h.requester) p.set('requester', h.requester);
    if (h.from) p.set('from', h.from);
    if (h.to) p.set('to', h.to);
    const d = await getJSON<{ tickets: TicketCard[] }>(`/api/tickets/history?${p}`);
    setHistoryTickets(d.tickets);
  }, []);

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

  const loadVideos = useCallback(async (tab: string) => {
    const d = await getJSON<{ videos: VideoT[] }>(`/api/videos?tab=${tab}`);
    setVideos(d.videos);
  }, []);

  // Restaura a tela a partir da URL (deep-link no F5, voltar/avançar do navegador).
  // Telas de formulário (compose/newticket) caem na lista correspondente.
  const restore = async (s: { view: View; id?: string }) => {
    if (s.view === 'ticket' && s.id) {
      setView('ticket'); setActiveTicket(null);
      try {
        const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${s.id}`);
        setActiveTicket(d.ticket);
        try { void postJSON(`/api/tickets/${s.id}/seen`); } catch { /* silencioso */ }
      } catch { setView('feed'); await loadStudies(); }
      return;
    }
    if (s.view === 'study' && s.id) {
      setView('study'); setActiveStudy(null);
      try { const d = await getJSON<{ study: StudyDetailT }>(`/api/studies/${s.id}`); setActiveStudy(d.study); }
      catch { setView('feed'); await loadStudies(); }
      return;
    }
    switch (s.view) {
      case 'saved': setView('saved'); await loadStudies({ saved: true }); break;
      case 'videos': setView('videos'); await loadVideos(videoTab); break;
      case 'tickets': case 'newticket': setView(s.view); await loadTickets(ticketFilter); break;
      case 'notifications': setView('notifications'); await loadNotifications(); break;
      case 'profile': setView('profile'); await loadNotifications(); break;
      default: setView('feed'); await loadStudies(); break; // feed, compose, ticket/study sem id
    }
  };
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  const restoredRef = useRef(false); // só espelha na URL depois da restauração inicial

  // init — restaura a tela da URL atual
  useEffect(() => {
    (async () => {
      const m = await refreshMe();
      setActing(m.defaultView);
      await restore(parseUrl(window.location.search));
      restoredRef.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMe]);

  // Espelha a tela atual na URL (pushState). O compare evita duplicar histórico
  // durante restauração (init/voltar), pois aí a URL já bate com o estado.
  useEffect(() => {
    if (!me || !restoredRef.current) return;
    if ((view === 'ticket' && !activeTicket?.id) || (view === 'study' && !activeStudy?.id)) return;
    const id = view === 'ticket' ? activeTicket?.id : view === 'study' ? activeStudy?.id : undefined;
    const url = urlForView(view, id || undefined);
    if (window.location.pathname + window.location.search !== url) {
      window.history.pushState(null, '', url);
    }
  }, [me, view, activeTicket?.id, activeStudy?.id]);

  // Voltar/avançar do navegador
  useEffect(() => {
    const onPop = () => { void restoreRef.current(parseUrl(window.location.search)); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // recarrega lista quando filtro/busca/período mudam no feed/salvos
  useEffect(() => {
    if (view === 'feed') loadStudies({ filter, search, from: dateFrom, to: dateTo });
    if (view === 'saved') loadStudies({ saved: true, from: dateFrom, to: dateTo });
  }, [filter, search, dateFrom, dateTo, view, loadStudies]);

  editingMessageRef.current = editingMessage;
  editingTicketRef.current = editingTicket;
  notifCountRef.current = notifications.length;

  // ---- polling em tempo real ----------------------------------------
  // Atualiza notificações/contadores sempre (10s); feed quando está no feed
  // (20s); estudo aberto e chamado aberto a cada 8s. Pausa enquanto a aba está
  // oculta — `visibilitychange`. Sem F5: novo estudo, nova pergunta, nova
  // resposta, novo alerta aparecem sozinhos.
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    const timers: ReturnType<typeof setInterval>[] = [];
    const safe = (fn: () => Promise<unknown> | void) => () => {
      if (cancelled || typeof document !== 'undefined' && document.hidden) return;
      try { void fn(); } catch { /* silencioso — o próximo tick tenta de novo */ }
    };
    // Sino + contadores (sempre que estiver na app)
    timers.push(setInterval(safe(refreshMe), 10000));
    // Feed/salvos
    if (view === 'feed') timers.push(setInterval(safe(() => loadStudies({ filter, search, from: dateFrom, to: dateTo })), 20000));
    if (view === 'saved') timers.push(setInterval(safe(() => loadStudies({ saved: true, from: dateFrom, to: dateTo })), 20000));
    // Estudo aberto → comentários novos
    if (view === 'study' && activeStudy?.id) {
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
    if (view === 'notifications') timers.push(setInterval(safe(() => { if (notifCountRef.current <= PAGE_NOTIF) loadNotifications(); }), 12000));
    // Lista de chamados se está aberta
    if (view === 'tickets') timers.push(setInterval(safe(() => loadTickets(ticketFilter)), 15000));
    return () => { cancelled = true; timers.forEach(clearInterval); };
  }, [me, view, activeStudy?.id, activeTicket?.id, filter, search, dateFrom, dateTo, ticketFilter, refreshMe, loadStudies, loadNotifications, loadTickets]);

  if (!me) return null;

  const isConsultor = acting === 'consultor';
  const categories = me.categories;
  const catNames = categories.map((c) => c.name);
  const colorOf = (c: string) => categories.find((x) => x.name === c)?.color || catColor(c);
  const firstCat = catNames[0] || 'Tributário';

  // ---- navegação ----
  const go = (v: View) => { setView(v); setCommentDraft(''); setCommentIsQuestion(false); setTicketDraft(''); scrollTop(); };
  const goFeed = () => { go('feed'); loadStudies({ filter, search }); };
  const goSaved = () => { go('saved'); loadStudies({ saved: true }); };
  const goTickets = () => { go('tickets'); loadTickets(ticketFilter); };
  const goNotifications = async () => { go('notifications'); await loadNotifications(); };
  const goProfile = async () => { go('profile'); await loadNotifications(); };
  const goVideos = async () => { go('videos'); await loadVideos(videoTab); };

  const openStudy = async (id: string) => { setView('study'); setActiveStudy(null); scrollTop(); const d = await getJSON<{ study: StudyDetailT }>(`/api/studies/${id}`); setActiveStudy(d.study); };
  // Marca as mensagens do chamado como lidas (recibo "visto") — fire-and-forget.
  const markTicketSeen = (id: string) => { try { void postJSON(`/api/tickets/${id}/seen`); } catch { /* silencioso */ } };
  const openTicket = async (id: string) => { setView('ticket'); setActiveTicket(null); setTicketDraft(''); setEditingTicket(null); setEditRef(null); setRefQuery(''); setRefResults([]); scrollTop(); const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${id}`); setActiveTicket(d.ticket); markTicketSeen(id); };

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
    if (!compose.title.trim()) { flashMsg('Adicione um título ao estudo'); return; }
    const payload = {
      title: compose.title,
      category: compose.category || firstCat,
      body: compose.body,
      coverImage: compose.coverImage,
      links: compose.links,
    };
    if (editingStudyId) {
      await fetch(`/api/studies/${editingStudyId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      flashMsg('Estudo atualizado');
    } else {
      await postJSON('/api/studies', payload);
      flashMsg('Estudo publicado com sucesso');
    }
    const wasEditing = editingStudyId;
    setEditingStudyId(null);
    setCompose({ title: '', category: '', body: '', linkInput: '', coverImage: null, links: [] });
    if (wasEditing) openStudy(wasEditing);
    else { go('feed'); loadStudies({ filter: 'Todos', search: '' }); setFilter('Todos'); setSearch(''); }
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
    });
    go('compose');
  };
  const deleteStudy = async (id: string) => {
    if (!confirm('Excluir este estudo? Esta ação não pode ser desfeita.')) return;
    await fetch(`/api/studies/${id}`, { method: 'DELETE' });
    flashMsg('Estudo excluído');
    go('feed'); loadStudies({ filter, search });
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

  // categorias (criar/editar/excluir) — só consultor/admin
  const createCategory = async (name: string, color: string) => {
    const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color }) });
    if (res.ok) { await refreshMe(); flashMsg('Categoria criada'); } else { flashMsg('Não foi possível criar (nome repetido?)'); }
  };
  const updateCategory = async (id: string, name: string, color: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color }) });
    if (res.ok) { await refreshMe(); if (view === 'feed') loadStudies({ filter, search }); flashMsg('Categoria atualizada'); } else { flashMsg('Não foi possível salvar'); }
  };
  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) { await refreshMe(); flashMsg('Categoria excluída'); } else { const d = await res.json().catch(() => null); flashMsg(d?.inUse ? `Em uso por ${d.inUse} registro(s)` : 'Não foi possível excluir'); }
  };

  const openLink = (url: string) => {
    const kind = linkKind(url);
    if (kind === 'video' || kind === 'drive') setEmbed({ url, kind, title: linkLabel(url) });
    else window.open(url, '_blank', 'noopener');
  };
  const cancelCompose = () => {
    const editing = editingStudyId;
    setEditingStudyId(null);
    setCompose({ title: '', category: '', body: '', linkInput: '', coverImage: null, links: [] });
    if (editing) openStudy(editing); else go('feed');
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
    if (n.targetType === 'study' && n.targetId) openStudy(n.targetId);
    else if (n.targetType === 'ticket' && n.targetId) openTicket(n.targetId);
  };
  const markAllRead = async () => { await postJSON('/api/notifications/read-all'); setNotifications((ns) => ns.map((x) => ({ ...x, read: true }))); flashMsg('Todas marcadas como lidas'); refreshMe(); };
  const logout = async () => { await postJSON('/api/logout'); window.location.href = '/login'; };
  const onPrimary = () => {
    if (isConsultor) {
      setEditingStudyId(null);
      setCompose({ title: '', category: '', body: '', linkInput: '', coverImage: null, links: [] });
      go('compose');
    } else startNewTicket();
  };

  const openTicketCount = me.counts.openTickets;
  const unreadCount = me.counts.unread;
  const savedCount = me.counts.saved;

  return {
    // estado base + setters
    me, theme, setTheme, nav, setNav, acting, setActing, view, setView,
    studies, setStudies, activeStudy, setActiveStudy, tickets, setTickets, activeTicket, setActiveTicket,
    notifications, setNotifications, notifTotal, setNotifTotal,
    viewsModal, setViewsModal, auditModal, setAuditModal, readsModal, setReadsModal,
    editingTicket, setEditingTicket, editRef, setEditRef,
    filter, setFilter, search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo,
    ticketFilter, setTicketFilter, ticketTab, setTicketTab, historyTickets, setHistoryTickets, hist, setHist,
    closing, setClosing, ratingHover, setRatingHover,
    videos, setVideos, videoTab, setVideoTab, videoFormOpen, setVideoFormOpen, editingVideo, setEditingVideo, syncingVideos, setSyncingVideos,
    compose, setCompose, coverUploading, setCoverUploading, embed, setEmbed, catManagerOpen, setCatManagerOpen,
    editingStudyId, setEditingStudyId, editingComment, setEditingComment, editingMessage, setEditingMessage,
    newTicket, setNewTicket, refQuery, setRefQuery, refResults, setRefResults, refSelected, setRefSelected, refSearching, setRefSearching,
    commentDraft, setCommentDraft, commentIsQuestion, setCommentIsQuestion, ticketDraft, setTicketDraft,
    commentInputRef, ticketInputRef, flash,
    // derivados
    isConsultor, categories, catNames, colorOf, firstCat, openTicketCount, unreadCount, savedCount,
    // loaders
    refreshMe, loadStudies, loadTickets, loadHistory, loadNotifications, loadMoreNotifications, loadVideos, flashMsg,
    // handlers
    go, goFeed, goSaved, goTickets, goNotifications, goProfile, goVideos, openStudy, openTicket,
    toggleLike, openViews, toggleSave, submitComment, publishStudy, startEditStudy, deleteStudy,
    saveComment, deleteComment, saveMessage, deleteMessage, openAudit, uploadCover, addComposeLink,
    createCategory, updateCategory, deleteCategory, openLink, cancelCompose, startNewTicket,
    searchRefTickets, selectRefTicket, startEditTicket, cancelEditTicket, pickEditRef, saveTicketEdit,
    submitTicket, sendTicketReply, closeTicket, saveVideo, deleteVideo, playVideo, toggleWatched,
    reclassifyVideo, syncVideos, openNotif, markAllRead, logout, onPrimary,
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
