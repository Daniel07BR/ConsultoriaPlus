// Ícone do anexo conforme o tipo de link. Extraído de AppClient (Fase 0).
import { IconPlay, IconFile, IconLink } from '../icons';

export function attIcon(kind: string, size = 15) {
  if (kind === 'video') return <IconPlay size={size} fill="var(--accent)" stroke="var(--accent)" />;
  if (kind === 'drive' || kind === 'file') return <IconFile size={size} stroke="var(--accent)" />;
  return <IconLink size={size} stroke="var(--accent)" />;
}
