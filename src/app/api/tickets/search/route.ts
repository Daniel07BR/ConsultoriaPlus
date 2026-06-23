// Busca de chamados p/ citação na abertura (por número #123 ou palavra-chave).
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { searchTickets } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q') || '';
  const exclude = sp.get('exclude') || undefined;
  const tickets = await searchTickets(me, q, exclude);
  return NextResponse.json({ tickets });
}
