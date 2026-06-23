// Mapeamento tela <-> rota real do Next (Fase 3). Substitui o antigo url-sync por
// query-string. As telas viram segmentos de rota sob o grupo (app).
import type { View } from './types';

// Caminho canônico de cada tela. study/ticket exigem id.
export function pathForView(view: View, id?: string): string {
  switch (view) {
    case 'feed': return '/feed';
    case 'saved': return '/salvos';
    case 'study': return id ? `/estudos/${id}` : '/feed';
    case 'compose': return '/publicar';
    case 'videos': return '/videos';
    case 'tickets': return '/chamados';
    case 'ticket': return id ? `/chamados/${id}` : '/chamados';
    case 'newticket': return '/novo-chamado';
    case 'notifications': return '/notificacoes';
    case 'profile': return '/perfil';
    default: return '/feed';
  }
}

// Deriva a tela (e o id, quando houver) a partir do pathname atual.
export function viewFromPath(path: string): { view: View; routeId?: string } {
  if (path.startsWith('/salvos')) return { view: 'saved' };
  if (path.startsWith('/videos')) return { view: 'videos' };
  if (path.startsWith('/publicar')) return { view: 'compose' };
  if (path.startsWith('/novo-chamado')) return { view: 'newticket' };
  if (path.startsWith('/notificacoes')) return { view: 'notifications' };
  if (path.startsWith('/perfil')) return { view: 'profile' };
  if (path.startsWith('/estudos/')) return { view: 'study', routeId: path.split('/')[2] };
  if (path.startsWith('/chamados/')) return { view: 'ticket', routeId: path.split('/')[2] };
  if (path.startsWith('/chamados')) return { view: 'tickets' };
  return { view: 'feed' }; // '/', '/feed' e qualquer outro caem no feed
}
