// Ícone da notificação conforme o tipo: pergunta (âmbar) vs comentário (azul). Puro.
import { IconQuestion, IconComment } from '../icons';

export function NotifIcon({ kind }: { kind: string }) {
  if (kind === 'pergunta') return <IconQuestion size={20} stroke="#e0902a" sw={2.2} />;
  return <IconComment size={20} stroke="#3b7fd6" sw={2.2} />;
}
