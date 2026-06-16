// Sincronizar com Nexus (manual). Só consultor/diretoria dispara.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { syncUsersFromNexus } from '@/lib/sync';

export const dynamic = 'force-dynamic';

export async function POST() {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  if (!me.canConsultor) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });
  try {
    const result = await syncUsersFromNexus();
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
