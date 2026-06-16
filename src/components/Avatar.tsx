'use client';
import { initials as toInitials, avatarGradient } from '@/lib/present';

interface Props {
  name: string;
  avatar?: string | null;
  size?: number;
  /** define o gradiente de fundo quando não há foto */
  role?: 'cliente' | 'consultor';
  font?: number;
}

/** Foto do Nexus quando disponível; senão, iniciais em gradiente. */
export default function Avatar({ name, avatar, size = 44, role = 'consultor', font }: Props) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontFamily: "'Space Grotesk',sans-serif",
    fontSize: font ?? Math.round(size * 0.34),
    objectFit: 'cover',
    overflow: 'hidden',
  };
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={name} style={style} />;
  }
  return (
    <div style={{ ...style, background: avatarGradient(role) }}>{toInitials(name)}</div>
  );
}
