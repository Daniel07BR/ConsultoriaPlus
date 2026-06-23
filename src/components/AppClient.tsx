'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import CategoryManager from './CategoryManager';
import VideoForm, { type VideoInput } from './VideoForm';
import { catColor, statusMeta, timeAgo, linkKind, linkLabel, embedUrl, RATING_LABELS, youtubeThumb } from '@/lib/present';
import { getJSON, postJSON } from '@/lib/client';
import {
  IconHome, IconTicket, IconBookmark, IconBell, IconPlus, IconHeart, IconComment, IconFile, IconLink,
  IconSearch, IconArrowRight, IconArrowLeft, IconCheck, IconSun, IconMoon, IconLayout, IconSend,
  IconLogout, IconQuestion, IconX, IconPlay, IconImage, IconExternal, IconVideo, IconRefresh,
  IconThumbsUp, IconEdit,
} from './icons';

// ícone do anexo conforme o tipo de link
function attIcon(kind: string, size = 15) {
  if (kind === 'video') return <IconPlay size={size} fill="var(--accent)" stroke="var(--accent)" />;
  if (kind === 'drive' || kind === 'file') return <IconFile size={size} stroke="var(--accent)" />;
  return <IconLink size={size} stroke="var(--accent)" />;
}

// Botão de curtir com popover ao passar o mouse mostrando quem curtiu.
function LikesHoverButton({
  studyId, count, liked, onToggle, style, label,
}: {
  studyId: string; count: number; liked: boolean; onToggle: () => void;
  style: React.CSSProperties; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<{ name: string; avatar: string | null; department: string | null }[] | null>(null);
  const loadedFor = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (loadedFor.current === `${studyId}:${count}`) return;
    try {
      const d = await getJSON<{ users: { name: string; avatar: string | null; department: string | null }[] }>(`/api/studies/${studyId}/like`);
      setUsers(d.users);
      loadedFor.current = `${studyId}:${count}`;
    } catch { /* silencioso */ }
  }, [studyId, count]);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => { setOpen(true); void load(); }}
      onMouseLeave={() => setOpen(false)}
    >
      <button onClick={onToggle} style={style}>
        <IconHeart size={label ? 19 : 18} fill={liked ? 'var(--accent)' : 'none'} stroke={liked ? 'var(--accent)' : 'currentColor'} />
        {label ? `${count} ${label}` : count}
      </button>
      {open && count > 0 && (
        <div
          style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, zIndex: 40,
            minWidth: 200, maxWidth: 280, maxHeight: 260, overflowY: 'auto',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
            boxShadow: '0 14px 36px var(--shadow)', padding: '10px 12px',
            animation: 'cpFade .15s ease',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
            Curtiram ({count})
          </div>
          {!users && <div style={{ fontSize: 13, color: 'var(--fg3)' }}>Carregando…</div>}
          {users && users.map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 0' }}>
              <Avatar name={u.name} avatar={u.avatar} size={26} role="cliente" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                {u.department && <div style={{ fontSize: 11, color: 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.department}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// corações da avaliação (1..5), n preenchidos
function Hearts({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconHeart key={i} size={size} fill={i <= n ? 'var(--accent)' : 'none'} stroke={i <= n ? 'var(--accent)' : 'var(--fg3)'} />
      ))}
    </span>
  );
}

type View = 'feed' | 'saved' | 'study' | 'compose' | 'tickets' | 'ticket' | 'newticket' | 'notifications' | 'profile' | 'videos';
type Acting = 'cliente' | 'consultor';

interface Me {
  user: { id: string; name: string; cargo: string | null; department: string | null; avatar: string | null };
  role: 'cliente' | 'consultor' | 'both';
  canConsultor: boolean;
  canSwitch: boolean;
  defaultView: Acting;
  counts: { openTickets: number; saved: number; unread: number };
  categories: CategoryT[];
}
interface CategoryT { id: string; name: string; color: string }
interface Attachment { kind: string; name: string; meta: string | null; url: string | null }
interface StudyCard {
  id: string; title: string; category: string; excerpt: string; coverImage: string | null; readTime: string | null; createdAt: string;
  author: { name: string; title: string | null; avatar: string | null; department: string | null };
  likes: number; liked: boolean; saved: boolean; commentCount: number; attachments: Attachment[];
  views: number; viewed: boolean;
}
interface ViewsPayload {
  total: number;
  viewedByMe: boolean;
  departments: { department: string; users: { name: string; avatar: string | null; cargo: string | null; viewedAt: string }[] }[];
}
interface CommentT { id: string; author: { name: string; avatar: string | null; department: string | null }; role: string; text: string; isQuestion: boolean; mine: boolean; createdAt: string }
interface StudyDetailT extends Omit<StudyCard, 'excerpt'> { body: string[]; comments: CommentT[] }
interface TicketCard {
  id: string; number: number; subject: string; category: string; status: string; rating: number | null; ratingLabel: string | null; createdAt: string;
  author: { name: string; avatar: string | null; department: string | null }; msgCount: number; lastPreview: string;
}
interface MessageT {
  id: string; author: { name: string; avatar: string | null; department: string | null }; role: string; text: string; mine: boolean; createdAt: string;
  edited: boolean; deleted: boolean; deletedReason: string | null; deletedByName: string | null; deletedAt: string | null;
}
interface TicketRefT { id: string; number: number; subject: string; status: string; createdAt: string; author: { name: string; avatar: string | null } }
interface AuditItemT { id: string; action: string; previousText: string; newText: string | null; reason: string | null; editorName: string; editorRole: string; messageAuthor: string | null; messageRole: string | null; createdAt: string }
interface TicketDetailT {
  id: string; number: number; subject: string; category: string; status: string; createdAt: string;
  rating: number | null; ratingLabel: string | null; closedAt: string | null;
  reference: { id: string; number: number; subject: string } | null;
  canReply: boolean; canClose: boolean; canEdit: boolean; auditCount: number;
  author: { name: string; avatar: string | null; department: string | null }; messages: MessageT[];
}
interface NotifT { id: string; kind: string; title: string; body: string; targetType: string | null; targetId: string | null; read: boolean; createdAt: string }
interface VideoT { id: string; title: string; description: string | null; url: string; youtubeId: string | null; thumbUrl: string | null; tab: string; source: string; courseTitle: string | null; sourceUrl: string | null; watched: boolean; author: { name: string; avatar: string | null } | null; createdAt: string }

const chipBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 15px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s ease' };

export default function AppClient() {
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
  const [viewsModal, setViewsModal] = useState<{ studyId: string; title: string; data: ViewsPayload | null } | null>(null);
  const [auditModal, setAuditModal] = useState<{ number: number; items: AuditItemT[] | null } | null>(null);
  const [editingTicket, setEditingTicket] = useState<{ subject: string } | null>(null);
  const [editRef, setEditRef] = useState<{ id: string; number: number; subject: string } | null>(null);

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
    const d = await getJSON<{ notifications: NotifT[] }>('/api/notifications');
    setNotifications(d.notifications);
  }, []);

  const loadVideos = useCallback(async (tab: string) => {
    const d = await getJSON<{ videos: VideoT[] }>(`/api/videos?tab=${tab}`);
    setVideos(d.videos);
  }, []);

  // init
  useEffect(() => {
    (async () => {
      const m = await refreshMe();
      setActing(m.defaultView);
      await loadStudies();
    })();
  }, [refreshMe, loadStudies]);

  // recarrega lista quando filtro/busca/período mudam no feed/salvos
  useEffect(() => {
    if (view === 'feed') loadStudies({ filter, search, from: dateFrom, to: dateTo });
    if (view === 'saved') loadStudies({ saved: true, from: dateFrom, to: dateTo });
  }, [filter, search, dateFrom, dateTo, view, loadStudies]);

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
    // Chamado aberto → mensagens novas
    if (view === 'ticket' && activeTicket?.id) {
      const id = activeTicket.id;
      timers.push(setInterval(safe(async () => {
        const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${id}`);
        setActiveTicket((cur) => (cur && cur.id === id && cur.messages.length !== d.ticket.messages.length ? d.ticket : cur));
      }), 8000));
    }
    // Lista de notificações se está aberta
    if (view === 'notifications') timers.push(setInterval(safe(loadNotifications), 12000));
    // Lista de chamados se está aberta
    if (view === 'tickets') timers.push(setInterval(safe(() => loadTickets(ticketFilter)), 15000));
    return () => { cancelled = true; timers.forEach(clearInterval); };
  }, [me, view, activeStudy?.id, activeTicket?.id, filter, search, dateFrom, dateTo, ticketFilter, refreshMe, loadStudies, loadNotifications, loadTickets]);

  if (!me) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg3)' }}>Carregando…</div>;
  }

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
  const openTicket = async (id: string) => { setView('ticket'); setActiveTicket(null); setTicketDraft(''); setEditingTicket(null); setEditRef(null); setRefQuery(''); setRefResults([]); scrollTop(); const d = await getJSON<{ ticket: TicketDetailT }>(`/api/tickets/${id}`); setActiveTicket(d.ticket); };

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

  // ---- estilos derivados ----
  const themeVars: React.CSSProperties = theme === 'dark'
    ? { ['--bg' as string]: '#161214', ['--surface' as string]: '#201b1d', ['--surface2' as string]: '#272022', ['--border' as string]: 'rgba(255,255,255,0.09)', ['--fg' as string]: '#f4ecef', ['--fg2' as string]: '#b3a6ab', ['--fg3' as string]: '#7c6f74', ['--shadow' as string]: 'rgba(0,0,0,0.45)', ['--accent-soft' as string]: '#ff5c8933' }
    : {};
  const sidebar = nav === 'sidebar';
  const navBtn = (active: boolean, horizontal: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 11, padding: horizontal ? '9px 15px' : '11px 14px', borderRadius: 11, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, width: horizontal ? 'auto' : '100%', textAlign: 'left',
    background: active ? 'var(--accent-soft)' : 'transparent', color: active ? 'var(--accent)' : 'var(--fg2)',
  });
  const roleBtn = (active: boolean): React.CSSProperties => ({ flex: 1, padding: '8px 10px', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", background: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--fg2)', boxShadow: active ? '0 2px 8px var(--accent-soft)' : undefined });
  const ticketBadge: React.CSSProperties = { marginLeft: 'auto', background: 'var(--accent)', color: '#fff', minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
  const notifBadge: React.CSSProperties = { background: 'var(--accent)', color: '#fff', minWidth: 19, height: 19, padding: '0 5px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };

  const openTicketCount = me.counts.openTickets;
  const unreadCount = me.counts.unread;
  const savedCount = me.counts.saved;
  const primaryLabel = isConsultor ? 'Publicar estudo' : 'Abrir chamado';

  const RoleSwitch = ({ horizontal }: { horizontal?: boolean }) => {
    if (!me.canSwitch) return null;
    return (
      <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: horizontal ? 11 : 13, padding: horizontal ? 3 : 4, gap: horizontal ? 3 : 4 }}>
        <button onClick={() => setActing('cliente')} style={roleBtn(!isConsultor)}>Cliente</button>
        <button onClick={() => setActing('consultor')} style={roleBtn(isConsultor)}>Consultor</button>
      </div>
    );
  };
  const ThemeBtn = ({ pad = 10 }: { pad?: number }) => (
    <button onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))} title="Alternar tema" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: pad, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
      {theme === 'light' ? <IconMoon size={17} /> : <IconSun size={17} />}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', transition: 'background-color .3s ease, color .3s ease', ...themeVars, background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* SIDEBAR */}
      {sidebar && (
        <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 268, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 18px', zIndex: 20, transition: 'background-color .3s ease, border-color .3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 6px 22px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 28, lineHeight: 1, boxShadow: '0 6px 16px var(--accent-soft)' }}>+</div>
            <div className="font-grotesk" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Consultoria<br /><span style={{ color: 'var(--accent)' }}>Plus</span></div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={goFeed} style={navBtn(view === 'feed' || view === 'study', false)}><IconHome size={19} /><span>Feed de estudos</span></button>
            <button onClick={goVideos} style={navBtn(view === 'videos', false)}><IconVideo size={19} /><span>Vídeos</span></button>
            <button onClick={goTickets} style={navBtn(view === 'tickets' || view === 'ticket', false)}><IconTicket size={19} /><span>Chamados</span>{openTicketCount > 0 && <span style={ticketBadge}>{openTicketCount}</span>}</button>
            <button onClick={goSaved} style={navBtn(view === 'saved', false)}><IconBookmark size={19} /><span style={{ flex: 1 }}>Estudos salvos</span><span style={{ fontSize: 12, color: 'var(--fg3)', fontWeight: 700 }}>{savedCount}</span></button>
            <button onClick={goNotifications} style={navBtn(view === 'notifications', false)}><IconBell size={19} /><span style={{ flex: 1 }}>Notificações</span>{unreadCount > 0 && <span style={notifBadge}>{unreadCount}</span>}</button>
          </nav>
          <button onClick={onPrimary} style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 12, borderRadius: 13, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 18px var(--accent-soft)' }}><IconPlus size={17} sw={2.4} />{primaryLabel}</button>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {me.canSwitch && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--fg3)', padding: '0 6px 8px' }}>Visão</div>
                <RoleSwitch />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}><ThemeBtn /></div>
              <button onClick={() => setNav('top')} title="Layout de navegação" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', cursor: 'pointer' }}><IconLayout size={17} /></button>
            </div>
            <button onClick={goProfile} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 11, borderRadius: 14, cursor: 'pointer', border: `1px solid ${view === 'profile' ? 'var(--accent)' : 'var(--border)'}`, background: view === 'profile' ? 'var(--accent-soft)' : 'var(--surface2)' }}>
              <Avatar name={me.user.name} avatar={me.user.avatar} size={36} role={acting} />
              <div style={{ minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--fg)' }}>{me.user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg3)' }}>{me.user.cargo || (isConsultor ? 'Consultor' : 'Cliente')}</div>
              </div>
            </button>
          </div>
        </aside>
      )}

      {/* TOP NAV */}
      {!sidebar && (
        <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24, lineHeight: 1, boxShadow: '0 6px 16px var(--accent-soft)' }}>+</div>
              <div className="font-grotesk" style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>Consultoria <span style={{ color: 'var(--accent)' }}>Plus</span></div>
            </div>
            <nav style={{ display: 'flex', gap: 6 }}>
              <button onClick={goFeed} style={navBtn(view === 'feed' || view === 'study', true)}>Feed</button>
              <button onClick={goVideos} style={navBtn(view === 'videos', true)}>Vídeos</button>
              <button onClick={goTickets} style={navBtn(view === 'tickets' || view === 'ticket', true)}>Chamados {openTicketCount > 0 && <span style={ticketBadge}>{openTicketCount}</span>}</button>
              <button onClick={goSaved} style={navBtn(view === 'saved', true)}>Salvos</button>
            </nav>
            <div style={{ flex: 1 }} />
            <RoleSwitch horizontal />
            <ThemeBtn pad={9} />
            <button onClick={() => setNav('sidebar')} title="Layout de navegação" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 9, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', cursor: 'pointer' }}><IconLayout size={17} /></button>
            <button onClick={goNotifications} title="Notificações" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 9, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', cursor: 'pointer' }}><IconBell size={17} />{unreadCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, ...notifBadge }}>{unreadCount}</span>}</button>
            <button onClick={goProfile} title="Minha área" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><Avatar name={me.user.name} avatar={me.user.avatar} size={38} role={acting} /></button>
            <button onClick={onPrimary} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 11, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 5px 14px var(--accent-soft)' }}><IconPlus size={15} sw={2.6} />{primaryLabel}</button>
          </div>
        </header>
      )}

      {/* MAIN */}
      <main style={{ marginLeft: sidebar ? 268 : 0, minHeight: '100vh' }}>
        <div style={{ maxWidth: sidebar ? 780 : 1100, margin: '0 auto', padding: '0 28px 100px' }}>
          {(view === 'feed' || view === 'saved') && FeedView()}
          {view === 'videos' && VideosView()}
          {view === 'study' && StudyView()}
          {view === 'compose' && ComposeView()}
          {view === 'tickets' && TicketsView()}
          {view === 'ticket' && TicketView()}
          {view === 'newticket' && NewTicketView()}
          {view === 'notifications' && NotificationsView()}
          {view === 'profile' && ProfileView()}
        </div>
      </main>

      {flash && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'var(--fg)', color: 'var(--bg)', padding: '13px 22px', borderRadius: 13, fontWeight: 700, fontSize: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.25)', animation: 'cpToast .25s ease', display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconCheck size={18} stroke="var(--accent)" sw={2.6} />{flash}
        </div>
      )}

      {/* Modal: quem visualizou o estudo (joinha) */}
      {viewsModal && (
        <div onClick={() => setViewsModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20, 8, 14, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'cpFade .2s ease' }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'hidden',
            background: 'var(--surface)', color: 'var(--fg)', borderRadius: 22,
            border: '2px solid var(--accent)',
            boxShadow: '0 0 0 6px rgba(255, 92, 137, 0.18), 0 24px 60px rgba(255, 92, 137, 0.28), 0 30px 80px rgba(0,0,0,0.35)',
            display: 'flex', flexDirection: 'column',
            animation: 'cpPop .28s cubic-bezier(.2,.9,.3,1.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <IconThumbsUp size={22} fill="var(--accent)" stroke="var(--accent)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-grotesk" style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Quem visualizou</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{viewsModal.title}</div>
              </div>
              <button onClick={() => setViewsModal(null)} title="Fechar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', cursor: 'pointer' }}>
                <IconX size={17} />
              </button>
            </div>
            <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {!viewsModal.data && <div style={{ color: 'var(--fg3)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Carregando…</div>}
              {viewsModal.data && viewsModal.data.total === 0 && (
                <div style={{ color: 'var(--fg3)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Ainda ninguém visualizou este estudo.</div>
              )}
              {viewsModal.data?.departments.map((g) => (
                <section key={g.department}>
                  <h4 className="font-grotesk" style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>{g.department} <span style={{ color: 'var(--fg3)', fontWeight: 600 }}>· {g.users.length}</span></h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {g.users.map((u, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                        <Avatar name={u.name} avatar={u.avatar} size={36} role="cliente" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                          {u.cargo && <div style={{ fontSize: 12, color: 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.cargo}</div>}
                        </div>
                        <span style={{ fontSize: 11.5, color: 'var(--fg3)', whiteSpace: 'nowrap' }}>{timeAgo(u.viewedAt)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: trilha de auditoria do chamado (edições/exclusões de mensagens) */}
      {auditModal && (
        <div onClick={() => setAuditModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20, 8, 14, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'cpFade .2s ease' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 620, maxHeight: '85vh', overflow: 'hidden', background: 'var(--surface)', color: 'var(--fg)', borderRadius: 22, border: '2px solid var(--accent)', boxShadow: '0 24px 60px rgba(255, 92, 137, 0.28), 0 30px 80px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', animation: 'cpPop .28s cubic-bezier(.2,.9,.3,1.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><IconRefresh size={21} sw={2.2} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-grotesk" style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Auditoria do chamado #{auditModal.number}</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg3)' }}>Edições e exclusões de mensagens · visível só para a consultoria</div>
              </div>
              <button onClick={() => setAuditModal(null)} title="Fechar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', cursor: 'pointer' }}><IconX size={17} /></button>
            </div>
            <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!auditModal.items && <div style={{ color: 'var(--fg3)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Carregando…</div>}
              {auditModal.items && auditModal.items.length === 0 && <div style={{ color: 'var(--fg3)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Nenhuma alteração registrada neste chamado.</div>}
              {auditModal.items?.map((it) => {
                const isDel = it.action === 'delete';
                return (
                  <div key={it.id} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', background: 'var(--surface2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em', background: isDel ? 'rgba(224,69,122,0.14)' : 'var(--accent-soft)', color: isDel ? '#e0457a' : 'var(--accent)' }}>{isDel ? 'EXCLUSÃO' : 'EDIÇÃO'}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{it.editorName}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--fg3)' }}>({it.editorRole === 'consultor' ? 'consultor' : 'cliente'})</span>
                      <div style={{ flex: 1 }} />
                      <span style={{ fontSize: 11.5, color: 'var(--fg3)' }}>{timeAgo(it.createdAt)}</span>
                    </div>
                    {it.messageAuthor && <div style={{ fontSize: 12, color: 'var(--fg3)', marginBottom: 8 }}>Mensagem de {it.messageAuthor}</div>}
                    {isDel ? (
                      <>
                        {it.reason && <div style={{ fontSize: 12.5, color: 'var(--fg2)', marginBottom: 8 }}><b>Motivo:</b> {it.reason}</div>}
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--fg3)', marginBottom: 4 }}>Conteúdo excluído</div>
                        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg2)', whiteSpace: 'pre-wrap' }}>{it.previousText}</p>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#e0457a', marginBottom: 4 }}>Antes</div>
                          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg2)', whiteSpace: 'pre-wrap', textDecoration: 'line-through', opacity: 0.75 }}>{it.previousText}</p>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#2f8a62', marginBottom: 4 }}>Depois</div>
                          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg)', whiteSpace: 'pre-wrap' }}>{it.newText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Viewer embutido (YouTube / Drive) */}
      {embed && (
        <div onClick={() => setEmbed(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 980, background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{embed.title}</span>
              <a href={embed.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', fontWeight: 700, fontSize: 12.5, textDecoration: 'none' }}>
                <IconExternal size={14} />Abrir no {embed.kind === 'video' ? 'YouTube' : 'Drive'}
              </a>
              <button onClick={() => setEmbed(null)} style={{ border: 'none', background: 'var(--surface2)', borderRadius: 9, width: 32, height: 32, cursor: 'pointer', color: 'var(--fg2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconX size={16} sw={2.4} /></button>
            </div>
            <div style={{ position: 'relative', width: '100%', aspectRatio: embed.kind === 'video' ? '16 / 9' : '4 / 3', background: '#000' }}>
              <iframe src={embedUrl(embed.url) || ''} title={embed.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
            </div>
          </div>
        </div>
      )}

      {catManagerOpen && (
        <CategoryManager
          categories={categories}
          onCreate={createCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
          onClose={() => setCatManagerOpen(false)}
        />
      )}

      {videoFormOpen && (
        <VideoForm
          initial={editingVideo}
          onSave={saveVideo}
          onClose={() => { setVideoFormOpen(false); setEditingVideo(undefined); }}
        />
      )}
    </div>
  );

  // ===================== VIEWS =====================

  // Detecta URLs no texto de uma conversa e as torna clicáveis. YouTube/Drive
  // abrem no visualizador embutido; demais abrem em nova aba.
  function Linkify({ text }: { text: string }) {
    const parts = text.split(/(https?:\/\/[^\s<]+)/g);
    return (
      <>
        {parts.map((p, i) => {
          if (/^https?:\/\//.test(p)) {
            const trail = (p.match(/[).,;:!?'"»]+$/) || [''])[0];
            const url = trail ? p.slice(0, p.length - trail.length) : p;
            return (
              <span key={i}>
                <a
                  href={url}
                  onClick={(e) => { e.preventDefault(); openLink(url); }}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}
                >{url}</a>{trail}
              </span>
            );
          }
          return <span key={i}>{p}</span>;
        })}
      </>
    );
  }

  function FeedView() {
    const isSaved = view === 'saved';
    const list = studies;
    return (
      <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
        <h1 className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{isSaved ? 'Estudos salvos' : 'Feed de estudos'}</h1>
        <p style={{ margin: '0 0 18px', color: 'var(--fg2)', fontSize: 15 }}>{isSaved ? 'Conteúdos que você guardou para ler depois.' : 'Conteúdos da equipe de consultoria. Curta, comente e tire suas dúvidas.'}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg2)' }}>Período de publicação:</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={dateInput} />
          <span style={{ color: 'var(--fg3)', fontSize: 13 }}>até</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={dateInput} />
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={miniBtn}>Limpar</button>}
        </div>

        {!isSaved && (
          <>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}><IconSearch size={18} stroke="var(--fg3)" /></span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar estudos, temas ou autores…" style={{ width: '100%', padding: '13px 16px 13px 44px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 14.5, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 24 }}>
              {['Todos', ...catNames].map((c) => {
                const active = filter === c;
                return (
                  <button key={c} onClick={() => setFilter(c)} style={{ ...chipBase, background: active ? 'var(--accent)' : 'var(--surface)', color: active ? '#fff' : 'var(--fg2)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}` }}>
                    {c !== 'Todos' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorOf(c) }} />}{c}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {list.map((s) => <StudyCardEl key={s.id} s={s} />)}
        </div>
        {list.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg3)' }}>
            <div className="font-grotesk" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg2)' }}>{isSaved ? 'Nenhum estudo salvo' : 'Nenhum estudo encontrado'}</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>{isSaved ? 'Toque no marcador de um estudo para guardá-lo aqui.' : 'Tente outra busca ou categoria.'}</div>
          </div>
        )}
      </div>
    );
  }

  function StudyCardEl({ s }: { s: StudyCard }) {
    return (
      <article style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 1px 3px var(--shadow)', padding: '22px 24px' }}>
        {s.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.coverImage} alt="" onClick={() => openStudy(s.id)} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 14, marginBottom: 16, display: 'block', cursor: 'pointer' }} />
        )}
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
          <Avatar name={s.author.name} avatar={s.author.avatar} size={44} role="consultor" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: 'nowrap' }}>{s.author.name}</span>
              {s.author.department && <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em', whiteSpace: 'nowrap' }}>{s.author.department}</span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[s.author.title, timeAgo(s.createdAt), s.readTime && `${s.readTime} de leitura`].filter(Boolean).join(' · ')}</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--fg2)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: colorOf(s.category) }} />{s.category}
          </span>
        </header>
        <h3 onClick={() => openStudy(s.id)} className="font-grotesk" style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.25, margin: '0 0 9px', cursor: 'pointer' }}>{s.title}</h3>
        <p style={{ margin: '0 0 16px', color: 'var(--fg2)', fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{s.excerpt}</p>
        {s.attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 16 }}>
            {s.attachments.map((a, i) => (
              <button key={i} onClick={() => a.url && openLink(a.url)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 13px', borderRadius: 11, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--fg2)', cursor: 'pointer' }}>
                {attIcon(a.kind)}{a.name}
              </button>
            ))}
          </div>
        )}
        <footer style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <LikesHoverButton studyId={s.id} count={s.likes} liked={s.liked} onToggle={() => toggleLike(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: 13.5, color: s.liked ? 'var(--accent)' : 'var(--fg2)' }} />
          <button onClick={() => openViews(s.id, s.title)} title="Marcar como visualizado e ver quem viu" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: 13.5, color: s.viewed ? 'var(--accent)' : 'var(--fg2)' }}>
            <IconThumbsUp size={18} fill={s.viewed ? 'var(--accent)' : 'none'} stroke={s.viewed ? 'var(--accent)' : 'currentColor'} />{s.views}
          </button>
          <button onClick={() => openStudy(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: 13.5, color: 'var(--fg2)' }}>
            <IconComment size={18} />{s.commentCount}
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => toggleSave(s.id)} title="Salvar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: s.saved ? 'var(--accent)' : 'var(--fg2)' }}>
            <IconBookmark size={17} fill={s.saved ? 'var(--accent)' : 'none'} stroke={s.saved ? 'var(--accent)' : 'currentColor'} />{s.saved ? 'Salvo' : 'Salvar'}
          </button>
          <button onClick={() => openStudy(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--accent-soft)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif" }}>Ler estudo<IconArrowRight size={15} sw={2.4} /></button>
        </footer>
      </article>
    );
  }

  function VideosView() {
    const tab = (k: 'treinamento' | 'sugerido', label: string) => (
      <button key={k} onClick={() => { setVideoTab(k); loadVideos(k); }} style={{ padding: '9px 16px', borderRadius: 11, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk',sans-serif", background: videoTab === k ? 'var(--accent-soft)' : 'transparent', color: videoTab === k ? 'var(--accent)' : 'var(--fg2)' }}>{label}</button>
    );
    return (
      <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
          <div>
            <h1 className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Vídeos</h1>
            <p style={{ margin: 0, color: 'var(--fg2)', fontSize: 15 }}>Treinamentos e vídeos sugeridos pela consultoria.</p>
          </div>
          {me!.canConsultor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={syncVideos} disabled={syncingVideos} title="Importar/atualizar os vídeos da categoria Consultoria do ClassRoom" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: syncingVideos ? 'default' : 'pointer', opacity: syncingVideos ? 0.6 : 1, whiteSpace: 'nowrap' }}><IconRefresh size={15} sw={2.4} /> {syncingVideos ? 'Sincronizando…' : 'Sincronizar ClassRoom'}</button>
              <button onClick={() => { setEditingVideo({ title: '', description: '', url: '', tab: videoTab }); setVideoFormOpen(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 5px 14px var(--accent-soft)', whiteSpace: 'nowrap' }}><IconPlus size={16} sw={2.6} /> Adicionar vídeo</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 13, padding: 4, marginBottom: 22, width: 'fit-content' }}>
          {tab('treinamento', 'Treinamentos')}
          {tab('sugerido', 'Vídeos sugeridos')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {videos.map((v) => (
            <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: '0 1px 3px var(--shadow)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <button onClick={() => playVideo(v)} style={{ position: 'relative', border: 'none', padding: 0, cursor: 'pointer', background: '#000', display: 'block' }}>
                {(v.youtubeId || v.thumbUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.youtubeId ? youtubeThumb(v.youtubeId) : v.thumbUrl!} alt={v.title} style={{ width: '100%', display: 'block', aspectRatio: '16 / 9', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '16 / 9', background: 'linear-gradient(135deg,#ff5c89,#fda8bf)' }} />
                )}
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.12)' }}>
                  <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,92,137,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.35)' }}><IconPlay size={26} fill="#fff" stroke="#fff" /></span>
                </span>
              </button>
              <div style={{ padding: '15px 17px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <div className="font-grotesk" onClick={() => playVideo(v)} style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, color: 'var(--fg)', cursor: 'pointer' }}>{v.title}</div>
                {v.description && <div style={{ fontSize: 13, color: 'var(--fg2)', lineHeight: 1.5 }}>{v.description}</div>}
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => toggleWatched(v)}
                  title={v.source === 'classroom' ? 'Marca como assistido também no ClassRoom' : undefined}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '9px 12px', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", marginTop: 6, border: v.watched ? '1px solid #1f9d6b' : '1px solid var(--border)', background: v.watched ? 'rgba(31,157,107,0.12)' : 'var(--surface2)', color: v.watched ? '#1f9d6b' : 'var(--fg2)' }}
                >
                  <IconCheck size={15} sw={v.watched ? 3 : 2.4} /> {v.watched ? 'Assistido' : 'Marcar como assistido'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  {v.source === 'classroom' ? (
                    <span style={{ fontSize: 12, color: 'var(--fg3)', flex: 1, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, fontSize: 10.5 }}>ClassRoom</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.courseTitle || 'Consultoria'}</span>
                    </span>
                  ) : (
                    <>
                      <Avatar name={v.author?.name || 'Consultoria'} avatar={v.author?.avatar || null} size={24} role="consultor" font={10} />
                      <span style={{ fontSize: 12, color: 'var(--fg3)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.author?.name || 'Consultoria'} · {timeAgo(v.createdAt)}</span>
                    </>
                  )}
                  {me!.canConsultor && (
                    <>
                      {v.tab === 'sugerido'
                        ? <button onClick={() => reclassifyVideo(v, 'treinamento')} title="Marcar como treinamento" style={miniBtn}>Treinamento</button>
                        : <button onClick={() => reclassifyVideo(v, 'sugerido')} title="Mover para vídeos sugeridos" style={miniBtn}>Sugerido</button>}
                      {v.source !== 'classroom' && (
                        <button onClick={() => { setEditingVideo({ id: v.id, title: v.title, description: v.description || '', url: v.url, tab: v.tab as 'treinamento' | 'sugerido' }); setVideoFormOpen(true); }} style={miniBtn}>Editar</button>
                      )}
                      <button onClick={() => deleteVideo(v.id)} title="Excluir" style={{ ...miniBtn, color: '#e0457a' }}><IconX size={13} sw={2.4} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {videos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg3)' }}>
            <div className="font-grotesk" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg2)' }}>Nenhum vídeo {videoTab === 'treinamento' ? 'de treinamento' : 'sugerido'} ainda</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>{me!.canConsultor ? 'Clique em "Adicionar vídeo" para incluir.' : 'Em breve a consultoria publicará vídeos aqui.'}</div>
          </div>
        )}
      </div>
    );
  }

  function StudyView() {
    const s = activeStudy;
    if (!s) return <div style={{ paddingTop: 60, textAlign: 'center', color: 'var(--fg3)' }}>Carregando estudo…</div>;
    return (
      <div style={{ paddingTop: 28, animation: 'cpFade .35s ease' }}>
        <button onClick={goFeed} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 22 }}><IconArrowLeft size={15} sw={2.4} /> Voltar ao feed</button>
        <article style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, boxShadow: '0 1px 3px var(--shadow)', padding: '34px 38px' }}>
          {s.coverImage && (
            <div style={{ textAlign: 'center', margin: '0 0 24px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.coverImage} alt="" style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 16, display: 'inline-block' }} />
            </div>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 13px', borderRadius: 999, background: 'var(--accent-soft)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 18 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: colorOf(s.category) }} />{s.category}</span>
          <h1 className="font-grotesk" style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.18, margin: '0 0 20px' }}>{s.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <Avatar name={s.author.name} avatar={s.author.avatar} size={46} role="consultor" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 700, fontSize: 15 }}>{s.author.name}</span>{s.author.department && <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>{s.author.department}</span>}</div>
              <div style={{ fontSize: 13, color: 'var(--fg3)' }}>{[s.author.title, timeAgo(s.createdAt), s.readTime && `${s.readTime} de leitura`].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
          <div style={{ fontSize: 16.5, lineHeight: 1.75, color: 'var(--fg)' }}>{s.body.map((p, i) => <p key={i} style={{ margin: '0 0 18px', whiteSpace: 'pre-wrap' }}>{p}</p>)}</div>
          {s.attachments.length > 0 && (
            <div style={{ marginTop: 26, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <div className="font-grotesk" style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg2)', marginBottom: 13 }}>Anexos e referências</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {s.attachments.map((a, i) => {
                  const embeddable = a.kind === 'video' || a.kind === 'drive';
                  return (
                    <button key={i} onClick={() => a.url && openLink(a.url)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{attIcon(a.kind, 20)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div><div style={{ fontSize: 12.5, color: 'var(--fg3)' }}>{a.meta || (embeddable ? 'Abrir aqui na plataforma' : 'Abrir em nova aba')}</div></div>
                      {embeddable ? <IconPlay size={18} fill="var(--fg3)" stroke="var(--fg3)" /> : <IconExternal size={18} stroke="var(--fg3)" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 26, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
            <LikesHoverButton studyId={s.id} count={s.likes} liked={s.liked} onToggle={() => toggleLike(s.id)} label="curtidas" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: s.liked ? 'var(--accent)' : 'var(--fg2)' }} />
            <button onClick={() => openViews(s.id, s.title)} title="Marcar como visualizado e ver quem viu" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: s.viewed ? 'var(--accent)' : 'var(--fg2)' }}><IconThumbsUp size={19} fill={s.viewed ? 'var(--accent)' : 'none'} stroke={s.viewed ? 'var(--accent)' : 'currentColor'} />{s.views} visualizações</button>
            <button onClick={() => toggleSave(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: s.saved ? 'var(--accent)' : 'var(--fg2)' }}><IconBookmark size={18} fill={s.saved ? 'var(--accent)' : 'none'} stroke={s.saved ? 'var(--accent)' : 'currentColor'} />{s.saved ? 'Salvo' : 'Salvar estudo'}</button>
            {me!.canConsultor && (
              <>
                <div style={{ flex: 1 }} />
                <button onClick={() => startEditStudy(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'var(--fg2)' }}>Editar</button>
                <button onClick={() => deleteStudy(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#e0457a' }}><IconX size={16} sw={2.4} /></button>
              </>
            )}
          </div>
        </article>

        <section style={{ marginTop: 24 }}>
          <h2 className="font-grotesk" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 16px' }}>Interações <span style={{ color: 'var(--fg3)', fontWeight: 600 }}>· {s.comments.length}</span></h2>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: '0 1px 3px var(--shadow)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Avatar name={me!.user.name} avatar={me!.user.avatar} size={40} role={acting} />
              <div style={{ flex: 1 }}>
                <textarea ref={commentInputRef} value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }} placeholder={isConsultor ? 'Responda como consultor… (Enter envia · Shift+Enter quebra linha)' : 'Escreva um comentário ou pergunta… (Enter envia · Shift+Enter quebra linha)'} rows={2} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg)', fontSize: 14.5, lineHeight: 1.5, outline: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                  {!isConsultor && (
                    <button onClick={() => setCommentIsQuestion((q) => !q)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, background: commentIsQuestion ? 'var(--accent)' : 'transparent', color: commentIsQuestion ? '#fff' : 'var(--fg2)', border: `1px solid ${commentIsQuestion ? 'var(--accent)' : 'var(--border)'}` }}><IconQuestion size={15} sw={2.2} />Marcar como pergunta</button>
                  )}
                  <div style={{ flex: 1 }} />
                  <button onClick={submitComment} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 11, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Publicar</button>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {s.comments.map((c) => {
              const isC = c.role === 'consultor';
              return (
                <div key={c.id} style={{ background: c.isQuestion ? 'var(--accent-soft)' : 'var(--surface2)', border: `1px solid ${c.isQuestion ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 16, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 9 }}>
                    <Avatar name={c.author.name} avatar={c.author.avatar} size={36} role={isC ? 'consultor' : 'cliente'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{c.author.name}</span>
                        {c.author.department && <span style={isC ? { background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '.03em' } : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg3)', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{c.author.department}</span>}
                        {c.isQuestion && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent)', color: '#fff', padding: '2px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em' }}>PERGUNTA</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--fg3)' }}>{timeAgo(c.createdAt)}</div>
                    </div>
                    {(c.mine || me!.canConsultor) && editingComment?.id !== c.id && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {c.isQuestion && me!.canConsultor && (
                          <button
                            onClick={() => {
                              setActing('consultor');
                              setCommentIsQuestion(false);
                              setCommentDraft((d) => d || `@${c.author.name.split(' ')[0]}, `);
                              setTimeout(() => commentInputRef.current?.focus(), 0);
                            }}
                            style={{ ...miniBtn, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700 }}
                          >Responder</button>
                        )}
                        {c.mine && <button onClick={() => setEditingComment({ id: c.id, text: c.text })} style={miniBtn}>Editar</button>}
                        <button onClick={() => deleteComment(c.id)} title="Excluir" style={{ ...miniBtn, color: '#e0457a' }}><IconX size={13} sw={2.4} /></button>
                      </div>
                    )}
                  </div>
                  {editingComment?.id === c.id ? (
                    <div>
                      <textarea value={editingComment.text} onChange={(e) => setEditingComment({ id: c.id, text: e.target.value })} rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 14, outline: 'none' }} />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                        <button onClick={() => setEditingComment(null)} style={miniBtn}>Cancelar</button>
                        <button onClick={saveComment} style={{ ...miniBtn, background: 'var(--accent)', color: '#fff', border: 'none' }}>Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--fg)', whiteSpace: 'pre-wrap' }}><Linkify text={c.text} /></p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  function ComposeView() {
    const selectedCat = compose.category || firstCat;
    return (
      <div style={{ paddingTop: 28, animation: 'cpFade .35s ease' }}>
        <button onClick={cancelCompose} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 22 }}><IconArrowLeft size={15} sw={2.4} /> Cancelar</button>
        <h1 className="font-grotesk" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{editingStudyId ? 'Editar estudo' : 'Publicar novo estudo'}</h1>
        <p style={{ margin: '0 0 16px', color: 'var(--fg2)', fontSize: 15 }}>Compartilhe conteúdo com os clientes. Adicione imagem de capa, vídeos do YouTube, arquivos do Drive e links.</p>
        {/* Atalho: pasta do Google Drive onde a consultoria mantém as matérias */}
        <a
          href="https://drive.google.com/drive/folders/11jn6CLRjNK-Sijl87BZqhcytUWP_3-AA"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', marginBottom: 22, borderRadius: 14,
            background: 'var(--accent-soft)', border: '1px solid var(--accent)',
            color: 'var(--accent)', textDecoration: 'none', fontWeight: 700, fontSize: 13.5,
            boxShadow: '0 4px 14px rgba(255, 92, 137, 0.12)',
          }}
          title="Abrir a pasta de matérias no Google Drive (nova aba)"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, background: '#fff', color: 'var(--accent)' }}>
            <IconFile size={17} stroke="var(--accent)" />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <span>Pasta de matérias no Drive</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg3)' }}>Atalho — abre em nova aba</span>
          </span>
          <IconExternal size={15} stroke="currentColor" sw={2.2} style={{ marginLeft: 'auto' }} />
        </a>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 1px 3px var(--shadow)', padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Título"><input value={compose.title} onChange={(e) => setCompose({ ...compose, title: e.target.value })} placeholder="Ex.: Reforma tributária — o que muda em 2026" style={inputStyle(true)} /></Field>

          {/* Imagem de capa */}
          <div>
            <label style={labelStyle}>Imagem de capa <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>(opcional — aparece centralizada no topo do estudo)</span></label>
            {compose.coverImage ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={compose.coverImage} alt="capa" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 14, display: 'block', border: '1px solid var(--border)' }} />
                <button onClick={() => setCompose((c) => ({ ...c, coverImage: null }))} title="Remover capa" style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconX size={16} sw={2.4} /></button>
              </div>
            ) : (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, border: '1.5px dashed var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <IconImage size={16} stroke="var(--accent)" />{coverUploading ? 'Enviando…' : 'Enviar imagem'}
                <input type="file" accept="image/*" style={{ display: 'none' }} disabled={coverUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.currentTarget.value = ''; }} />
              </label>
            )}
          </div>

          {/* Categoria + gerenciar */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Categoria</label>
              <button onClick={() => setCatManagerOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--accent)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}><IconPlus size={13} sw={2.4} />Gerenciar categorias</button>
            </div>
            <select value={selectedCat} onChange={(e) => setCompose({ ...compose, category: e.target.value })} style={{ ...inputStyle(), cursor: 'pointer' }}>{catNames.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </div>

          <Field label="Conteúdo"><textarea value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} rows={7} placeholder="Escreva o estudo aqui. Use parágrafos para organizar as ideias…" style={{ ...inputStyle(), lineHeight: 1.65 }} /></Field>

          {/* Links: vídeo do YouTube, arquivo do Drive ou site */}
          <div>
            <label style={labelStyle}>Vídeos, arquivos e links</label>
            <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginBottom: 10 }}>Cole um link do <b>YouTube</b>, do <b>Google Drive</b> ou de qualquer <b>site</b>. Vídeos e arquivos do Drive abrem dentro da plataforma.</div>
            <div style={{ display: 'flex', gap: 9, marginBottom: 12 }}>
              <input value={compose.linkInput} onChange={(e) => setCompose({ ...compose, linkInput: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addComposeLink(); } }} placeholder="https://youtube.com/…  ·  https://drive.google.com/…  ·  https://…" style={{ ...inputStyle(), flex: 1, padding: '11px 14px', fontSize: 13.5 }} />
              <button onClick={addComposeLink} style={{ padding: '11px 18px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Adicionar</button>
            </div>
            {compose.links.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                {compose.links.map((l, i) => (
                  <span key={i} style={attachPill}>{attIcon(linkKind(l.url), 14)}{linkLabel(l.url)}<button onClick={() => setCompose((c) => ({ ...c, links: c.links.filter((_, j) => j !== i) }))} style={pillX}><IconX size={14} sw={2.4} /></button></span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
            <button onClick={cancelCompose} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={publishStudy} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 18px var(--accent-soft)' }}>{editingStudyId ? 'Salvar alterações' : 'Publicar estudo'}</button>
          </div>
        </div>
      </div>
    );
  }

  function tCard(t: TicketCard) {
    const sm = statusMeta(t.status);
    return (
      <button key={t.id} onClick={() => openTicket(t.id)} style={{ textAlign: 'left', color: 'var(--fg)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 1px 3px var(--shadow)', padding: '22px 24px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Avatar name={t.author.name} avatar={t.author.avatar} size={44} role="cliente" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: 'nowrap' }}>{t.author.name}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 999, background: sm.tint, color: sm.text, fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em', whiteSpace: 'nowrap' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.dot }} />{sm.label}</span>
              {t.status === 'fechado' && t.rating && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: 'var(--accent)' }}><Hearts n={t.rating} size={13} /> {t.ratingLabel}</span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Cliente · {timeAgo(t.createdAt)} · {t.msgCount} {t.msgCount === 1 ? 'mensagem' : 'mensagens'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={ticketNumChip} title={`Chamado nº ${t.number}`}>#{t.number}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--fg2)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: colorOf(t.category) }} />{t.category}</span>
          </div>
        </div>
        <div className="font-grotesk" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.25, margin: '0 0 8px' }}>{t.subject}</div>
        <p style={{ margin: '0 0 16px', color: 'var(--fg2)', fontSize: 14.5, lineHeight: 1.6 }}>{t.lastPreview}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 13.5, color: 'var(--fg2)' }}><IconComment size={18} />{t.msgCount} {t.msgCount === 1 ? 'mensagem' : 'mensagens'}</span>
          <div style={{ flex: 1 }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif" }}>Ver conversa<IconArrowRight size={15} sw={2.4} /></span>
        </div>
      </button>
    );
  }

  function TicketsView() {
    // Finalizados (fechado) saem da fila e ficam só no Histórico.
    const tf = ['todos', 'aberto', 'andamento', 'respondido'];
    const tfLabel: Record<string, string> = { todos: 'Todos', aberto: 'Aberto', andamento: 'Em andamento', respondido: 'Respondido' };
    const tab = (k: 'meus' | 'historico', label: string) => (
      <button onClick={() => { setTicketTab(k); if (k === 'historico') loadHistory(hist); }} style={{ padding: '9px 16px', borderRadius: 11, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk',sans-serif", background: ticketTab === k ? 'var(--accent-soft)' : 'transparent', color: ticketTab === k ? 'var(--accent)' : 'var(--fg2)' }}>{label}</button>
    );
    return (
      <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
          <h1 className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Chamados</h1>
          <button onClick={startNewTicket} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 5px 14px var(--accent-soft)', whiteSpace: 'nowrap' }}><IconPlus size={16} sw={2.6} /> Abrir chamado</button>
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 13, padding: 4, marginBottom: 20, width: 'fit-content' }}>
          {tab('meus', isConsultor ? 'Fila de atendimento' : 'Meus chamados')}
          {tab('historico', 'Histórico (todos)')}
        </div>

        {ticketTab === 'meus' ? (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 22 }}>
              {tf.map((k) => { const active = ticketFilter === k; return <button key={k} onClick={() => { setTicketFilter(k); loadTickets(k); }} style={{ ...chipBase, background: active ? 'var(--accent)' : 'var(--surface)', color: active ? '#fff' : 'var(--fg2)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}` }}>{tfLabel[k]}</button>; })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{tickets.map(tCard)}</div>
            {tickets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg3)' }}>
                <div className="font-grotesk" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg2)' }}>Nenhum chamado neste filtro</div>
                <div style={{ fontSize: 14, marginTop: 6 }}>Altere o filtro de status acima.</div>
              </div>
            )}
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 14px', color: 'var(--fg2)', fontSize: 14 }}>Todos os chamados do sistema. Busque por título, por quem abriu ou por período.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 22, alignItems: 'center' }}>
              <input value={hist.q} onChange={(e) => setHist({ ...hist, q: e.target.value })} placeholder="Título do chamado…" style={{ ...inputStyle(), flex: '1 1 200px', padding: '10px 13px', fontSize: 13.5 }} />
              <input value={hist.requester} onChange={(e) => setHist({ ...hist, requester: e.target.value })} placeholder="Quem abriu…" style={{ ...inputStyle(), flex: '1 1 160px', padding: '10px 13px', fontSize: 13.5 }} />
              <input type="date" value={hist.from} onChange={(e) => setHist({ ...hist, from: e.target.value })} style={dateInput} />
              <span style={{ color: 'var(--fg3)', fontSize: 13 }}>até</span>
              <input type="date" value={hist.to} onChange={(e) => setHist({ ...hist, to: e.target.value })} style={dateInput} />
              <button onClick={() => loadHistory(hist)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><IconSearch size={15} stroke="#fff" /> Buscar</button>
              {(hist.q || hist.requester || hist.from || hist.to) && <button onClick={() => { const empty = { q: '', requester: '', from: '', to: '' }; setHist(empty); loadHistory(empty); }} style={miniBtn}>Limpar</button>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{historyTickets.map(tCard)}</div>
            {historyTickets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg3)' }}>
                <div className="font-grotesk" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg2)' }}>Nenhum chamado encontrado</div>
                <div style={{ fontSize: 14, marginTop: 6 }}>Ajuste a busca ou o período.</div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function TicketView() {
    const t = activeTicket;
    if (!t) return <div style={{ paddingTop: 60, textAlign: 'center', color: 'var(--fg3)' }}>Carregando chamado…</div>;
    const sm = statusMeta(t.status);
    return (
      <div style={{ paddingTop: 28, animation: 'cpFade .35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button onClick={goTickets} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><IconArrowLeft size={15} sw={2.4} /> Todos os chamados</button>
          <div style={{ flex: 1 }} />
          {me!.canConsultor && t.auditCount > 0 && (
            <button onClick={openAudit} title="Ver edições e exclusões de mensagens deste chamado" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><IconRefresh size={15} sw={2.2} /> Auditoria <span style={{ ...notifBadge, background: 'var(--fg3)' }}>{t.auditCount}</span></button>
          )}
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 1px 3px var(--shadow)', padding: '24px 26px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 13 }}>
            <span style={ticketNumChip} title={`Chamado nº ${t.number}`}>#{t.number}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 999, background: sm.tint, color: sm.text, fontSize: 11.5, fontWeight: 700 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: sm.dot }} />{sm.label}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--fg3)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: colorOf(t.category) }} />{t.category}</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12.5, color: 'var(--fg3)' }}>Aberto {timeAgo(t.createdAt)}</span>
            {t.canEdit && !editingTicket && (
              <button onClick={startEditTicket} title="Editar título e citação" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}><IconEdit size={14} sw={2.2} /> Editar</button>
            )}
          </div>
          {editingTicket ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Título do chamado</label>
                <input value={editingTicket.subject} onChange={(e) => setEditingTicket({ subject: e.target.value })} style={inputStyle(true)} />
              </div>
              <div>
                <label style={labelStyle}>Chamado citado <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>(vincule ou desvincule um chamado de referência)</span></label>
                {editRef ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent-soft)' }}>
                    <IconTicket size={18} stroke="var(--accent)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{editRef.number} · {editRef.subject}</div>
                    </div>
                    <button onClick={() => setEditRef(null)} title="Desvincular" style={{ ...miniBtn, color: '#e0457a' }}>Desvincular</button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: 22, transform: 'translateY(-50%)', pointerEvents: 'none' }}><IconSearch size={17} stroke="var(--fg3)" /></span>
                    <input value={refQuery} onChange={(e) => searchRefTickets(e.target.value, t.id)} placeholder="Pesquise pelo número (#12) ou palavra-chave…" style={{ ...inputStyle(), padding: '12px 14px 12px 40px' }} />
                    {(refSearching || refResults.length > 0 || !!refQuery.trim()) && (
                      <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', overflow: 'hidden', boxShadow: '0 8px 24px var(--shadow)' }}>
                        {refSearching && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--fg3)' }}>Buscando…</div>}
                        {!refSearching && refResults.map((rt) => (
                          <button key={rt.id} onClick={() => pickEditRef(rt)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', cursor: 'pointer' }}>
                            <span style={ticketNumChip}>#{rt.number}</span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rt.subject}</span>
                              <span style={{ display: 'block', fontSize: 12, color: 'var(--fg3)' }}>{rt.author.name} · {timeAgo(rt.createdAt)}</span>
                            </span>
                          </button>
                        ))}
                        {!refSearching && refQuery.trim() && refResults.length === 0 && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--fg3)' }}>Nenhum chamado encontrado.</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={cancelEditTicket} style={{ padding: '10px 18px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={saveTicketEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 11, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}><IconCheck size={15} sw={2.4} /> Salvar</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-grotesk" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, margin: 0 }}>{t.subject}</h1>
              {t.reference && (
                <button
                  onClick={() => openTicket(t.reference!.id)}
                  title="Abrir o chamado citado para ver o contexto"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginTop: 14, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', cursor: 'pointer', textAlign: 'left', maxWidth: '100%' }}
                >
                  <IconLink size={16} stroke="var(--accent)" />
                  <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg3)' }}>Refere-se ao chamado</span>
                    <span style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{t.reference.number} · {t.reference.subject}</span>
                  </span>
                  <IconArrowRight size={15} sw={2.4} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </button>
              )}
            </>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
          {t.messages.map((m) => { const right = m.role === 'consultor'; const isC = m.role === 'consultor'; const del = m.deleted; return (
            <div key={m.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: right ? 'row-reverse' : 'row' }}>
              <Avatar name={m.author.name} avatar={m.author.avatar} size={38} role={isC ? 'consultor' : 'cliente'} />
              <div style={{ flex: 1, maxWidth: '82%', padding: '14px 16px', borderRadius: 16, background: del ? 'var(--surface2)' : (right ? 'var(--accent-soft)' : 'var(--surface)'), border: del ? '1px dashed var(--border)' : `1px solid ${right ? 'var(--accent-soft)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', color: del ? 'var(--fg3)' : undefined }}>{m.author.name}</span>
                  {m.author.department && <span style={isC ? { background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 } : { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--fg3)', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{m.author.department}</span>}
                  <span style={{ fontSize: 11.5, color: 'var(--fg3)' }}>· {timeAgo(m.createdAt)}{m.edited && !del ? ' · editado' : ''}</span>
                  {!del && (m.mine || me!.canConsultor) && editingMessage?.id !== m.id && (
                    <span style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                      {m.mine && <button onClick={() => setEditingMessage({ id: m.id, text: m.text })} style={miniBtn}>Editar</button>}
                      <button onClick={() => deleteMessage(m.id)} title="Excluir" style={{ ...miniBtn, color: '#e0457a' }}><IconX size={13} sw={2.4} /></button>
                    </span>
                  )}
                </div>
                {editingMessage?.id === m.id ? (
                  <div>
                    <textarea value={editingMessage.text} onChange={(e) => setEditingMessage({ id: m.id, text: e.target.value })} rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 14, outline: 'none' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                      <button onClick={() => setEditingMessage(null)} style={miniBtn}>Cancelar</button>
                      <button onClick={saveMessage} style={{ ...miniBtn, background: 'var(--accent)', color: '#fff', border: 'none' }}>Salvar</button>
                    </div>
                  </div>
                ) : del ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--fg3)', fontStyle: 'italic' }}>
                      <IconX size={14} sw={2.4} /> Mensagem excluída{m.deletedByName ? ` por ${m.deletedByName}` : ''}{m.deletedAt ? ` · ${timeAgo(m.deletedAt)}` : ''}
                    </div>
                    {m.deletedReason && <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginTop: 4 }}>Motivo: {m.deletedReason}</div>}
                    {me!.canConsultor && m.text && (
                      <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, border: '1px dashed var(--border)', background: 'var(--surface)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 5 }}>Conteúdo original · visível só para a consultoria</div>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--fg2)', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}><Linkify text={m.text} /></p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}><Linkify text={m.text} /></p>
                )}
              </div>
            </div>
          ); })}
        </div>
        {/* Chamado fechado: mostra a avaliação */}
        {t.status === 'fechado' ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 22px', boxShadow: '0 1px 3px var(--shadow)', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--fg2)', marginBottom: 10 }}>Chamado fechado pelo cliente{t.closedAt ? ` · ${timeAgo(t.closedAt)}` : ''}</div>
            {t.rating ? (
              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Hearts n={t.rating} size={26} />
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)', fontFamily: "'Space Grotesk',sans-serif" }}>{t.ratingLabel}</div>
              </div>
            ) : <div style={{ color: 'var(--fg3)', fontSize: 14 }}>Sem avaliação.</div>}
          </div>
        ) : (
          <>
            {/* Caixa de resposta (dono ou consultor) */}
            {t.canReply && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, boxShadow: '0 1px 3px var(--shadow)', marginBottom: t.canClose ? 14 : 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--fg2)', marginBottom: 10 }}>{isConsultor ? 'Responder ao cliente' : 'Adicionar resposta'}</div>
                <textarea ref={ticketInputRef} value={ticketDraft} onChange={(e) => setTicketDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTicketReply(); } }} rows={3} placeholder={isConsultor ? 'Escreva a resposta da consultoria… (Enter envia · Shift+Enter quebra linha)' : 'Escreva sua mensagem… (Enter envia · Shift+Enter quebra linha)'} style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg)', fontSize: 14.5, lineHeight: 1.55, outline: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 11 }}>
                  <button onClick={sendTicketReply} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}><IconSend size={16} /> Enviar</button>
                </div>
              </div>
            )}

            {/* Fechar + avaliar (só o cliente que abriu) */}
            {t.canClose && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--accent-soft)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px var(--shadow)' }}>
                {!closing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>Já resolveu sua dúvida?</div>
                      <div style={{ fontSize: 13, color: 'var(--fg3)' }}>Feche o chamado e avalie o atendimento.</div>
                    </div>
                    <button onClick={() => { setClosing(true); setRatingHover(0); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}><IconCheck size={16} sw={2.4} /> Fechar e avaliar</button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--fg)', marginBottom: 4, fontFamily: "'Space Grotesk',sans-serif" }}>Como foi o atendimento?</div>
                    <div style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 14 }}>Toque nos corações para avaliar.</div>
                    <div style={{ display: 'inline-flex', gap: 6, marginBottom: 8 }} onMouseLeave={() => setRatingHover(0)}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} onMouseEnter={() => setRatingHover(i)} onClick={() => closeTicket(i)} title={RATING_LABELS[i]} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}>
                          <IconHeart size={34} fill={i <= ratingHover ? 'var(--accent)' : 'none'} stroke={i <= ratingHover ? 'var(--accent)' : 'var(--fg3)'} />
                        </button>
                      ))}
                    </div>
                    <div style={{ height: 22, fontWeight: 700, fontSize: 15, color: 'var(--accent)', fontFamily: "'Space Grotesk',sans-serif" }}>{ratingHover ? RATING_LABELS[ratingHover] : ''}</div>
                    <button onClick={() => { setClosing(false); setRatingHover(0); }} style={{ ...miniBtn, marginTop: 8 }}>Cancelar</button>
                  </div>
                )}
              </div>
            )}

            {/* Visualização sem permissão de resposta (histórico de outro usuário) */}
            {!t.canReply && !t.canClose && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', color: 'var(--fg3)', fontSize: 13.5, textAlign: 'center' }}>
                Você está visualizando este chamado pelo histórico.
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function NewTicketView() {
    return (
      <div style={{ paddingTop: 28, animation: 'cpFade .35s ease' }}>
        <button onClick={goTickets} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 22 }}><IconArrowLeft size={15} sw={2.4} /> Cancelar</button>
        <h1 className="font-grotesk" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Abrir um chamado</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--fg2)', fontSize: 15 }}>Descreva sua dúvida e a equipe de consultoria responderá por aqui.</p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 1px 3px var(--shadow)', padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Assunto"><input value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} placeholder="Resuma sua dúvida em uma frase" style={inputStyle(true)} /></Field>
          <Field label="Categoria"><select value={newTicket.category || firstCat} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })} style={{ ...inputStyle(), cursor: 'pointer' }}>{catNames.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
          <Field label="Descrição"><textarea value={newTicket.body} onChange={(e) => setNewTicket({ ...newTicket, body: e.target.value })} rows={6} placeholder="Detalhe o contexto, prazos e o que você precisa saber…" style={{ ...inputStyle(), lineHeight: 1.65 }} /></Field>

          {/* Citar um chamado anterior — pesquise por número ou palavra-chave */}
          <div>
            <label style={labelStyle}>Citar chamado anterior <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>(opcional — dá contexto ao consultor)</span></label>
            {refSelected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent-soft)' }}>
                <IconTicket size={18} stroke="var(--accent)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{refSelected.number} · {refSelected.subject}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg3)' }}>{refSelected.author.name} · {timeAgo(refSelected.createdAt)}</div>
                </div>
                <button onClick={() => selectRefTicket(null)} title="Remover citação" style={miniBtn}><IconX size={13} sw={2.4} /></button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: 22, transform: 'translateY(-50%)', pointerEvents: 'none' }}><IconSearch size={17} stroke="var(--fg3)" /></span>
                <input value={refQuery} onChange={(e) => searchRefTickets(e.target.value)} placeholder="Pesquise pelo número (#12) ou palavra-chave…" style={{ ...inputStyle(), padding: '12px 14px 12px 40px' }} />
                {(refSearching || refResults.length > 0 || (!!refQuery.trim())) && (
                  <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', overflow: 'hidden', boxShadow: '0 8px 24px var(--shadow)' }}>
                    {refSearching && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--fg3)' }}>Buscando…</div>}
                    {!refSearching && refResults.map((t) => (
                      <button key={t.id} onClick={() => selectRefTicket(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', cursor: 'pointer' }}>
                        <span style={ticketNumChip}>#{t.number}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</span>
                          <span style={{ display: 'block', fontSize: 12, color: 'var(--fg3)' }}>{t.author.name} · {timeAgo(t.createdAt)}</span>
                        </span>
                      </button>
                    ))}
                    {!refSearching && refQuery.trim() && refResults.length === 0 && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--fg3)' }}>Nenhum chamado encontrado.</div>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
            <button onClick={goTickets} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={submitTicket} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 18px var(--accent-soft)' }}>Enviar chamado</button>
          </div>
        </div>
      </div>
    );
  }

  function NotifIcon({ kind }: { kind: string }) {
    if (kind === 'pergunta') return <IconQuestion size={20} stroke="var(--accent)" sw={2.2} />;
    if (kind === 'chamado' || kind === 'resposta') return <IconTicket size={20} stroke="var(--accent)" />;
    return <IconHeart size={20} fill="var(--accent)" stroke="var(--accent)" />;
  }

  function NotificationsView() {
    return (
      <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
          <h1 className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Notificações</h1>
          {unreadCount > 0 && <button onClick={markAllRead} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}><IconCheck size={15} sw={2.2} /> Marcar todas como lidas</button>}
        </div>
        <p style={{ margin: '0 0 22px', color: 'var(--fg2)', fontSize: 15 }}>Comentários, perguntas e respostas dos seus chamados.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {notifications.map((n) => (
            <button key={n.id} onClick={() => openNotif(n)} style={{ textAlign: 'left', color: 'var(--fg)', display: 'flex', alignItems: 'flex-start', gap: 14, background: n.read ? 'var(--surface)' : 'var(--accent-soft)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px', cursor: 'pointer' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><NotifIcon kind={n.kind} /></div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <div style={{ fontSize: 14.5, lineHeight: 1.5 }}><span style={{ fontWeight: 700 }}>{n.title}</span> <span style={{ color: 'var(--fg2)' }}>{n.body}</span></div>
                <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
              </div>
              {!n.read && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />}
            </button>
          ))}
          {notifications.length === 0 && <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--fg3)', fontSize: 14 }}>Nenhuma notificação por enquanto.</div>}
        </div>
      </div>
    );
  }

  function ProfileView() {
    const stats = isConsultor
      ? [{ n: studies.length, l: 'Estudos no feed' }, { n: studies.reduce((a, s) => a + s.likes, 0), l: 'Curtidas no feed' }, { n: openTicketCount, l: 'Chamados ativos' }]
      : [{ n: tickets.length, l: 'Chamados abertos' }, { n: savedCount, l: 'Estudos salvos' }, { n: studies.filter((s) => s.liked).length, l: 'Estudos curtidos' }];
    return (
      <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 1px 3px var(--shadow)', padding: 28, display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
          <Avatar name={me!.user.name} avatar={me!.user.avatar} size={68} role={acting} font={24} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-grotesk" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{me!.user.name}</div>
            <div style={{ fontSize: 14, color: 'var(--fg2)', marginTop: 2 }}>{[me!.user.cargo, me!.user.department].filter(Boolean).join(' · ')}</div>
          </div>
          <button onClick={logout} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, border: 'none', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}><IconLogout size={15} sw={2.2} /> Sair</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
          {stats.map((st, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <div className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{st.n}</div>
              <div style={{ fontSize: 13, color: 'var(--fg2)', marginTop: 7, fontWeight: 600 }}>{st.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>
          <button onClick={goSaved} style={{ flex: 1, textAlign: 'left', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconBookmark size={19} fill="var(--accent)" stroke="var(--accent)" /></div>
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>Estudos salvos</div><div style={{ fontSize: 12.5, color: 'var(--fg3)' }}>{savedCount} guardados</div></div>
          </button>
          <button onClick={goTickets} style={{ flex: 1, textAlign: 'left', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconTicket size={19} stroke="var(--accent)" /></div>
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>{isConsultor ? 'Chamados' : 'Meus chamados'}</div><div style={{ fontSize: 12.5, color: 'var(--fg3)' }}>{openTicketCount} ativos</div></div>
          </button>
        </div>
        <h2 className="font-grotesk" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 14px' }}>Atividade recente</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {notifications.slice(0, 6).map((n) => (
            <button key={n.id} onClick={() => openNotif(n)} style={{ textAlign: 'left', color: 'var(--fg)', display: 'flex', alignItems: 'flex-start', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '15px 18px', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><NotifIcon kind={n.kind} /></div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}><span style={{ fontWeight: 700 }}>{n.title}</span> <span style={{ color: 'var(--fg2)' }}>{n.body}</span></div>
                <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
              </div>
            </button>
          ))}
          {notifications.length === 0 && <div style={{ color: 'var(--fg3)', fontSize: 14 }}>Sem atividade recente.</div>}
        </div>
      </div>
    );
  }
}

// ---- pequenos helpers de form ----
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 700, fontSize: 13, color: 'var(--fg2)', marginBottom: 8 };
function inputStyle(grotesk = false): React.CSSProperties {
  return { width: '100%', padding: '13px 15px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg)', fontSize: grotesk ? 15 : 14.5, fontFamily: grotesk ? "'Space Grotesk',sans-serif" : undefined, fontWeight: grotesk ? 600 : undefined, outline: 'none' };
}
const attachPill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 10px 8px 13px', borderRadius: 11, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700 };
const miniBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' };
const dateInput: React.CSSProperties = { padding: '8px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 13, outline: 'none', colorScheme: 'light' as React.CSSProperties['colorScheme'] };
const pillX: React.CSSProperties = { display: 'inline-flex', border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', padding: 0, marginLeft: 2 };
const ticketNumChip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '.01em', flexShrink: 0 };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label style={labelStyle}>{label}</label>{children}</div>);
}
