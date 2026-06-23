'use client';
// Card "Visualizada por" (recibo de leitura + data/hora). Extraído (Fase 2).
import Avatar from '../Avatar';
import { IconCheckDouble, IconX } from '../icons';
import { dateTime } from '@/lib/present';
import { useApp } from '../AppProvider';

export function ReadsModal() {
  const { readsModal, setReadsModal } = useApp();
  if (!readsModal) return null;
  return (
    <div onClick={() => setReadsModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20, 8, 14, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'cpFade .2s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', color: 'var(--fg)', borderRadius: 20, border: '2px solid var(--accent)', boxShadow: '0 24px 60px rgba(255, 92, 137, 0.28), 0 30px 80px rgba(0,0,0,0.35)', overflow: 'hidden', animation: 'cpPop .28s cubic-bezier(.2,.9,.3,1.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><IconCheckDouble size={20} stroke="var(--accent)" sw={2.4} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-grotesk" style={{ fontWeight: 700, fontSize: 15.5 }}>Visualizada por</div>
            {readsModal.preview && <div style={{ fontSize: 12, color: 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{readsModal.preview}</div>}
          </div>
          <button onClick={() => setReadsModal(null)} title="Fechar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', cursor: 'pointer' }}><IconX size={16} /></button>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {readsModal.items.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={r.name} avatar={r.avatar} size={36} role={r.role === 'consultor' ? 'consultor' : 'cliente'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.03em', padding: '2px 8px', borderRadius: 999, background: r.role === 'consultor' ? 'var(--accent-soft)' : 'var(--surface2)', color: r.role === 'consultor' ? 'var(--accent)' : 'var(--fg3)', border: r.role === 'consultor' ? 'none' : '1px solid var(--border)' }}>{r.role === 'consultor' ? 'Consultor' : 'Cliente'}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginTop: 2 }}>{dateTime(r.readAt)}</div>
              </div>
              <IconCheckDouble size={16} stroke="var(--accent)" sw={2.4} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
