'use client';
// Casca do app (Fase 3): layout (sidebar/topnav), toast e modais. O conteúdo de
// cada rota entra via {children}. O estado vem de AppProvider (montado no layout).
import Avatar from './Avatar';
import CategoryManager from './CategoryManager';
import VideoForm from './VideoForm';
import {
  IconHome, IconTicket, IconBookmark, IconPlus, IconLayout,
  IconSun, IconMoon, IconVideo, IconCheck, IconUsers,
} from './icons';
import { useApp } from './AppProvider';
import { ViewsModal } from './modals/ViewsModal';
import { AuditModal } from './modals/AuditModal';
import { ReadsModal } from './modals/ReadsModal';
import { EmbedModal } from './modals/EmbedModal';

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    me, theme, setTheme, nav, setNav, acting, setActing, view, feed,
    isConsultor, unseenTicketCount, savedCount, openQEstudos, openQGestao, categories, flash,
    catManagerOpen, setCatManagerOpen, videoFormOpen, setVideoFormOpen, editingVideo, setEditingVideo,
    createCategory, updateCategory, deleteCategory, saveVideo,
    goFeed, goGestao, goSaved, goTickets, goProfile, goVideos, onPrimary,
  } = useApp();

  // ---- estilos derivados ----
  const themeVars: React.CSSProperties = theme === 'dark'
    ? { ['--bg' as string]: '#161214', ['--surface' as string]: '#201b1d', ['--surface2' as string]: '#272022', ['--border' as string]: 'rgba(255,255,255,0.09)', ['--fg' as string]: '#f4ecef', ['--fg2' as string]: '#b3a6ab', ['--fg3' as string]: '#7c6f74', ['--shadow' as string]: 'rgba(0,0,0,0.45)', ['--accent-soft' as string]: '#ff5c8933' }
    : {};
  // Identidade própria do Feed de Gestão: troca o accent (rosa → índigo) enquanto
  // se navega nas telas de gestão. Vence o themeVars (vem depois no spread).
  const gestaoAccent: React.CSSProperties = feed === 'gestao'
    ? { ['--accent' as string]: '#4f46e5', ['--accent-strong' as string]: '#4338ca', ['--accent-soft' as string]: theme === 'dark' ? '#4f46e533' : '#e8e7fb' }
    : {};
  const sidebar = nav === 'sidebar';
  const navBtn = (active: boolean, horizontal: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 11, padding: horizontal ? '9px 15px' : '11px 14px', borderRadius: 11, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, width: horizontal ? 'auto' : '100%', textAlign: 'left',
    background: active ? 'var(--accent-soft)' : 'transparent', color: active ? 'var(--accent)' : 'var(--fg2)',
  });
  const roleBtn = (active: boolean): React.CSSProperties => ({ flex: 1, padding: '8px 10px', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", background: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--fg2)', boxShadow: active ? '0 2px 8px var(--accent-soft)' : undefined });
  const ticketBadge: React.CSSProperties = { marginLeft: 'auto', background: 'var(--accent)', color: '#fff', minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
  // Badge âmbar de "perguntas em aberto" (coisa a responder) nos itens de feed.
  const alertBadge: React.CSSProperties = { marginLeft: 'auto', background: '#f5a623', color: '#fff', minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
  const alertBadgeInline: React.CSSProperties = { ...alertBadge, marginLeft: 6 };

  const primaryLabel = feed === 'gestao' ? 'Publicar na Gestão' : isConsultor ? 'Publicar estudo' : 'Abrir chamado';

  const RoleSwitch = ({ horizontal }: { horizontal?: boolean }) => {
    if (!me.canSwitch) return null;
    return (
      <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: horizontal ? 11 : 13, padding: horizontal ? 3 : 4, gap: horizontal ? 3 : 4 }}>
        <button onClick={() => setActing('cliente')} style={roleBtn(!isConsultor)}>Usuário</button>
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
    <div style={{ minHeight: '100vh', transition: 'background-color .3s ease, color .3s ease', ...themeVars, ...gestaoAccent, background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* SIDEBAR */}
      {sidebar && (
        <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 268, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 18px', zIndex: 20, transition: 'background-color .3s ease, border-color .3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 6px 22px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 28, lineHeight: 1, boxShadow: '0 6px 16px var(--accent-soft)' }}>+</div>
            <div className="font-grotesk" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Consultoria<br /><span style={{ color: 'var(--accent)' }}>Plus</span></div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={goFeed} style={navBtn(view === 'feed' || view === 'study', false)}><IconHome size={19} /><span style={{ flex: 1 }}>Feed de estudos</span>{openQEstudos > 0 && <span className="cp-alert-dot" style={alertBadge} title="Perguntas em aberto">{openQEstudos}</span>}</button>
            {me.canGestao && <button onClick={goGestao} style={navBtn(view === 'gestao' || view === 'gestaoStudy' || view === 'gestaoCompose', false)}><IconUsers size={19} /><span style={{ flex: 1 }}>Feed de Gestão</span>{openQGestao > 0 && <span className="cp-alert-dot" style={alertBadge} title="Perguntas em aberto">{openQGestao}</span>}</button>}
            <button onClick={goVideos} style={navBtn(view === 'videos', false)}><IconVideo size={19} /><span>Vídeos</span></button>
            <button onClick={goTickets} style={navBtn(view === 'tickets' || view === 'ticket', false)}><IconTicket size={19} /><span>Chamados</span>{unseenTicketCount > 0 && <span style={ticketBadge}>{unseenTicketCount}</span>}</button>
            <button onClick={goSaved} style={navBtn(view === 'saved', false)}><IconBookmark size={19} /><span style={{ flex: 1 }}>Estudos salvos</span><span style={{ fontSize: 12, color: 'var(--fg3)', fontWeight: 700 }}>{savedCount}</span></button>
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
              <button onClick={goFeed} style={navBtn(view === 'feed' || view === 'study', true)}>Feed {openQEstudos > 0 && <span className="cp-alert-dot" style={alertBadgeInline}>{openQEstudos}</span>}</button>
              {me.canGestao && <button onClick={goGestao} style={navBtn(view === 'gestao' || view === 'gestaoStudy' || view === 'gestaoCompose', true)}>Gestão {openQGestao > 0 && <span className="cp-alert-dot" style={alertBadgeInline}>{openQGestao}</span>}</button>}
              <button onClick={goVideos} style={navBtn(view === 'videos', true)}>Vídeos</button>
              <button onClick={goTickets} style={navBtn(view === 'tickets' || view === 'ticket', true)}>Chamados {unseenTicketCount > 0 && <span style={ticketBadge}>{unseenTicketCount}</span>}</button>
              <button onClick={goSaved} style={navBtn(view === 'saved', true)}>Salvos</button>
            </nav>
            <div style={{ flex: 1 }} />
            <RoleSwitch horizontal />
            <ThemeBtn pad={9} />
            <button onClick={() => setNav('sidebar')} title="Layout de navegação" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 9, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', cursor: 'pointer' }}><IconLayout size={17} /></button>
            <button onClick={goProfile} title="Minha área" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}><Avatar name={me.user.name} avatar={me.user.avatar} size={38} role={acting} /></button>
            <button onClick={onPrimary} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 11, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 5px 14px var(--accent-soft)' }}><IconPlus size={15} sw={2.6} />{primaryLabel}</button>
          </div>
        </header>
      )}

      {/* MAIN */}
      <main style={{ marginLeft: sidebar ? 268 : 0, minHeight: '100vh' }}>
        <div style={{ maxWidth: sidebar ? 780 : 1100, margin: '0 auto', padding: '0 28px 100px' }}>
          {children}
        </div>
      </main>

      {flash && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'var(--fg)', color: 'var(--bg)', padding: '13px 22px', borderRadius: 13, fontWeight: 700, fontSize: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.25)', animation: 'cpToast .25s ease', display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconCheck size={18} stroke="var(--accent)" sw={2.6} />{flash}
        </div>
      )}

      <ViewsModal />
      <AuditModal />
      <ReadsModal />
      <EmbedModal />

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
}
