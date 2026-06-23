// Corações da avaliação (1..5), n preenchidos. Extraído de AppClient (Fase 0).
import { IconHeart } from '../icons';

export function Hearts({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconHeart key={i} size={size} fill={i <= n ? 'var(--accent)' : 'none'} stroke={i <= n ? 'var(--accent)' : 'var(--fg3)'} />
      ))}
    </span>
  );
}
