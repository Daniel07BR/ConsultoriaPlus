'use client';
// Card de estudo no feed/salvos. Extraído de AppClient (Fase 2).
import Avatar from '../Avatar';
import { IconThumbsUp, IconComment, IconBookmark, IconArrowRight } from '../icons';
import { attIcon } from '../ui/attIcon';
import { LikesHoverButton } from '../ui/LikesHoverButton';
import { timeAgo, consultorColor } from '@/lib/present';
import { useApp } from '../AppProvider';
import type { StudyCard } from '@/lib/types';

export function StudyCardEl({ s }: { s: StudyCard }) {
  const { openStudy, colorOf, openLink, toggleLike, openViews, toggleSave } = useApp();
  // Realce colorido na borda pela cor do autor (mesma dos chamados: Marina rosé,
  // Edilaine teal). Só no feed de estudos — o feed de gestão mantém o tema índigo.
  const ac = s.feed === 'estudos' ? consultorColor(s.author.name) : null;
  const border = ac ? `1px solid ${ac}66` : '1px solid var(--border)';
  const boxShadow = ac ? `0 0 0 1px ${ac}66, 0 6px 20px ${ac}33` : '0 1px 3px var(--shadow)';
  return (
    <article style={{ background: 'var(--surface)', border, borderRadius: 20, boxShadow, padding: '22px 24px' }}>
      {s.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.coverImage} alt="" onClick={() => openStudy(s.id, s.feed)} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 14, marginBottom: 16, display: 'block', cursor: 'pointer' }} />
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
      <h3 onClick={() => openStudy(s.id, s.feed)} className="font-grotesk" style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.25, margin: '0 0 9px', cursor: 'pointer' }}>{s.title}</h3>
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
        <button onClick={() => openStudy(s.id, s.feed)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: 13.5, color: 'var(--fg2)' }}>
          <IconComment size={18} />{s.commentCount}
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => toggleSave(s.id)} title="Salvar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: s.saved ? 'var(--accent)' : 'var(--fg2)' }}>
          <IconBookmark size={17} fill={s.saved ? 'var(--accent)' : 'none'} stroke={s.saved ? 'var(--accent)' : 'currentColor'} />{s.saved ? 'Salvo' : 'Salvar'}
        </button>
        <button onClick={() => openStudy(s.id, s.feed)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--accent-soft)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif" }}>Ler estudo<IconArrowRight size={15} sw={2.4} /></button>
      </footer>
    </article>
  );
}
