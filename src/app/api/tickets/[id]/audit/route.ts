// Trilha de auditoria de um chamado: edições e exclusões de mensagens. Só consultor.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { ticketAudit } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  if (!me.canConsultor) return NextResponse.json({ error: 'sem acesso' }, { status: 403 });
  const { id } = await params;
  const items = await ticketAudit(id);
  return NextResponse.json({ items });
}
