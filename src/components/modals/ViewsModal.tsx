'use client';
// Modal "Quem visualizou o estudo" (joinha). Extraído de AppClient (Fase 2).
import Avatar from '../Avatar';
import { IconThumbsUp, IconX } from '../icons';
import { timeAgo } from '@/lib/present';
import { useApp } from '../AppProvider';

export function ViewsModal() {
  const { viewsModal, setViewsModal } = useApp();
  if (!viewsModal) return null;
  return (
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
  );
}
