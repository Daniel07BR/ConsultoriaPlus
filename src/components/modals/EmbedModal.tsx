'use client';
// Viewer embutido (YouTube / Drive). Extraído de AppClient (Fase 2).
import { IconExternal, IconX } from '../icons';
import { embedUrl } from '@/lib/present';
import { useApp } from '../AppProvider';

export function EmbedModal() {
  const { embed, setEmbed } = useApp();
  if (!embed) return null;
  return (
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
  );
}
