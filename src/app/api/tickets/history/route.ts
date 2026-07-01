// Histórico global de chamados — visível a TODOS. Busca por título, autor e período.
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { listTicketsHistory } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const sp = req.nextUrl.searchParams;
  const limit = parseInt(sp.get('limit') || '', 10);
  const offset = parseInt(sp.get('offset') || '', 10);
  const { tickets, total } = await listTicketsHistory(me, {
    q: sp.get('q') || undefined,
    requester: sp.get('requester') || undefined,
    from: sp.get('from') || undefined,
    to: sp.get('to') || undefined,
    limit: Number.isInteger(limit) ? limit : undefined,
    offset: Number.isInteger(offset) ? offset : undefined,
  });
  return NextResponse.json({ tickets, total });
}
