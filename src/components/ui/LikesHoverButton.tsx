'use client';
// Botão de curtir com popover ao passar o mouse mostrando quem curtiu.
// Extraído de AppClient (Fase 0).
import { useCallback, useRef, useState } from 'react';
import Avatar from '../Avatar';
import { IconHeart } from '../icons';
import { getJSON } from '@/lib/client';

export function LikesHoverButton({
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
