import 'server-only';
import { NextResponse } from 'next/server';
import { getCurrentUser, type CurrentUser } from './auth';

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
