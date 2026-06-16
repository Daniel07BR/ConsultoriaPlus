import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { listTickets } from '@/lib/queries';
import { notifyNewTicket } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const status = req.nextUrl.searchParams.get('status') || undefined;
  const tickets = await listTickets(me, status);
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const b = await req.json().catch(() => null);
  const subject = (b?.subject || '').trim();
  if (!subject) return NextResponse.json({ error: 'assunto obrigatório' }, { status: 400 });
  const cats = await prisma.category.findMany({ orderBy: { position: 'asc' }, select: { name: true } });
  const names = cats.map((c) => c.name);
  const category = names.includes(b?.category) ? b.category : names[0] || 'Tributário';
  const body = (b?.body || '').trim() || subject;

  const ticket = await prisma.ticket.create({
    data: {
      requesterId: me.user.id,
      subject,
      category,
      status: 'aberto',
      messages: { create: [{ authorId: me.user.id, role: 'cliente', text: body }] },
    },
  });
  await notifyNewTicket(ticket.id, subject, { id: me.user.id, name: me.user.name });
  return NextResponse.json({ id: ticket.id });
}
