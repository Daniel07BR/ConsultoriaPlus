// Helpers de apresentação — puros, usáveis no client e no server.

export const CATEGORIES = ['Tributário', 'Fiscal', 'Societário', 'Folha de Pagamento', 'Contábil'] as const;
export type Category = (typeof CATEGORIES)[number];

const CAT_COLORS: Record<string, string> = {
  Tributário: '#ff5c89',
  Fiscal: '#e0457a',
  Societário: '#fb8cac',
  'Folha de Pagamento': '#fda8bf',
  Contábil: '#f06a98',
};

export function catColor(c: string): string {
  return CAT_COLORS[c] || '#ff5c89';
}

export type TicketStatus = 'aberto' | 'andamento' | 'respondido';

export interface StatusMeta {
  label: string;
  dot: string;
  tint: string;
  text: string;
}

export function statusMeta(s: string): StatusMeta {
  if (s === 'aberto') return { label: 'Aberto', dot: '#ff5c89', tint: 'var(--accent-soft)', text: 'var(--accent)' };
  if (s === 'andamento') return { label: 'Em andamento', dot: '#f5a623', tint: 'rgba(245,166,35,0.16)', text: '#c47d10' };
  if (s === 'fechado') return { label: 'Fechado', dot: '#8a7d83', tint: 'rgba(138,125,131,0.16)', text: '#6b5f64' };
  return { label: 'Respondido', dot: '#3f9e74', tint: 'rgba(63,158,116,0.16)', text: '#2f8a62' };
}

// Avaliação do atendimento (1..5 corações), com rótulo por nível.
export const RATING_LABELS: Record<number, string> = {
  1: 'Não resolvido',
  2: 'Resolveu pouco',
  3: 'Ajudou',
  4: 'Muito bom',
  5: 'Solucionado',
};

export function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function timeAgo(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return 'agora';
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `há ${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  return d.toLocaleDateString('pt-BR');
}

export function avatarGradient(role: string): string {
  return role === 'consultor'
    ? 'linear-gradient(135deg,#ff5c89,#fda8bf)'
    : 'linear-gradient(135deg,#8a7d83,#bcaeb4)';
}

// ---------- Links (YouTube / Google Drive / site) ----------

export type LinkKind = 'video' | 'drive' | 'link';

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function driveId(url: string): string | null {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/);
  return m ? m[1] : null;
}

/** Classifica o link para escolher o visualizador. */
export function linkKind(url: string): LinkKind {
  if (youtubeId(url)) return 'video';
  if (driveId(url)) return 'drive';
  return 'link';
}

/** Thumbnail (capa) do vídeo no YouTube a partir do id. */
export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/** URL embutível (iframe) para abrir dentro da plataforma; null se não há embed. */
export function embedUrl(url: string): string | null {
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}`;
  const dr = driveId(url);
  if (dr) return `https://drive.google.com/file/d/${dr}/preview`;
  return null;
}

/** Rótulo amigável a partir da URL (host ou "Vídeo do YouTube"/"Arquivo do Drive"). */
export function linkLabel(url: string, fallback?: string): string {
  if (fallback) return fallback;
  if (youtubeId(url)) return 'Vídeo do YouTube';
  if (driveId(url)) return 'Arquivo do Google Drive';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
