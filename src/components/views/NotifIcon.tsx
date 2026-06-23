// Ícone da notificação conforme o tipo. Puro. Extraído de AppClient (Fase 2).
import { IconQuestion, IconTicket, IconHeart } from '../icons';

export function NotifIcon({ kind }: { kind: string }) {
  if (kind === 'pergunta') return <IconQuestion size={20} stroke="var(--accent)" sw={2.2} />;
  if (kind === 'chamado' || kind === 'resposta') return <IconTicket size={20} stroke="var(--accent)" />;
  return <IconHeart size={20} fill="var(--accent)" stroke="var(--accent)" />;
}
