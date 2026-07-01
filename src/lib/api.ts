import 'server-only';
import { NextResponse } from 'next/server';
import { getCurrentUser, type CurrentUser } from './auth';
import { canSeeGestaoStudy } from './roles';

/** Carrega o usuário ou devolve 401. Use: const me = await requireUser(); if (me instanceof NextResponse) return me; */
export async function requireUser(): Promise<CurrentUser | NextResponse> {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });
  return me;
}

/** Papel de atuação validado: clientes só atuam como 'cliente'; consultor exige permissão. */
export function resolveActingRole(me: CurrentUser, requested?: string): 'cliente' | 'consultor' {
  if (requested === 'consultor' && me.canConsultor) return 'consultor';
  return 'cliente';
}

/**
 * Guarda de feed: bloqueia (403) qualquer operação sobre um estudo do Feed de
 * Gestão para quem não tem acesso. Retorna a resposta de erro, ou null se ok.
 * Use após carregar `study.feed`:
 *   const denied = ensureFeedAccess(me, study.feed); if (denied) return denied;
 */
export function ensureFeedAccess(me: CurrentUser, feed: string): NextResponse | null {
  if (feed === 'gestao' && !me.canGestao) {
    return NextResponse.json({ error: 'sem acesso ao feed de gestão' }, { status: 403 });
  }
  return null;
}

/**
 * Guarda por PUBLICAÇÃO no Feed de Gestão: além do acesso ao feed, respeita a
 * segmentação por departamento (departamentos ocultos da publicação). O autor sempre
 * acessa o próprio post; Diretoria/Consultoria/Admin veem tudo; um Gestor/Sub cujo
 * departamento foi ocultado leva 403. Para o feed de estudos delega ao ensureFeedAccess.
 * Use após carregar `{ feed, authorId, excludedDepartments }`:
 *   const denied = ensureStudyAccess(me, study); if (denied) return denied;
 */
export function ensureStudyAccess(
  me: CurrentUser,
  study: { feed: string; authorId: string; excludedDepartments?: string[] | null },
): NextResponse | null {
  if (study.feed !== 'gestao') return ensureFeedAccess(me, study.feed);
  if (!me.canGestao) return NextResponse.json({ error: 'sem acesso ao feed de gestão' }, { status: 403 });
  if (study.authorId === me.user.id) return null; // autor sempre vê o próprio
  if (canSeeGestaoStudy(me.role, me.user.cargo, me.user.department, study.excludedDepartments)) return null;
  return NextResponse.json({ error: 'publicação não disponível para o seu departamento' }, { status: 403 });
}
