import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { getTicket } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const ticket = await getTicket(me, id);
  if (!ticket) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  return NextResponse.json({ ticket });
}
