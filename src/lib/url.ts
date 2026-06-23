// Sincronização da tela com a URL (deep-link, F5, voltar/avançar).
// Extraído de AppClient na Fase 0 do refactor.
import type { View } from './types';

export const VIEW_SLUG: Record<View, string> = {
  feed: 'feed', saved: 'salvos', study: 'estudo', compose: 'publicar',
  tickets: 'chamados', ticket: 'chamado', newticket: 'novo-chamado',
  notifications: 'notificacoes', profile: 'perfil', videos: 'videos',
};
export const SLUG_VIEW: Record<string, View> = Object.fromEntries(
  Object.entries(VIEW_SLUG).map(([v, slug]) => [slug, v as View]),
);
export function urlForView(view: View, id?: string): string {
  const slug = VIEW_SLUG[view] || 'feed';
  const p = new URLSearchParams();
  if (slug !== 'feed') p.set('v', slug);
  if (id && (view === 'ticket' || view === 'study')) p.set('id', id);
  const qs = p.toString();
  return qs ? `/?${qs}` : '/';
}
export function parseUrl(search: string): { view: View; id?: string } {
  const p = new URLSearchParams(search);
  const view = SLUG_VIEW[p.get('v') || 'feed'] || 'feed';
  return { view, id: p.get('id') || undefined };
}
