import { NextResponse } from 'next/server';
import { requireUser, resolveActingRole } from '@/lib/api';
import { prisma } from '@/lib/db';
import { notifyTicketReply } from '@/lib/notify';
import { notifyNexusTicketReply } from '@/lib/notify-nexus';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const b = await req.json().catch(() => null);
  const text = (b?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'texto obrigatório' }, { status: 400 });

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, subject: true, requesterId: true },
  });
  if (!ticket) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  // Cliente só responde no próprio chamado.
  if (!me.canConsultor && ticket.requesterId !== me.user.id) {
    return NextResponse.json({ error: 'sem acesso' }, { status: 403 });
  }

  const role = resolveActingRole(me, b?.actingRole);
  const newStatus = role === 'consultor' ? 'respondido' : 'andamento';

  const [message] = await prisma.$transaction([
    prisma.ticketMessage.create({ data: { ticketId: id, authorId: me.user.id, role, text } }),
    prisma.ticket.update({ where: { id }, data: { status: newStatus } }),
  ]);
  await notifyTicketReply(ticket, { id: me.user.id, name: me.user.name }, role);

  // Alerta cross-system no Nexus (sino em qualquer sistema + badge do card).
  void notifyNexusTicketReply({
    ticketId: ticket.id,
    subject: ticket.subject,
    messageId: message.id,
    senderRole: role,
    senderNexusUserId: me.user.nexusUserId,
    senderAppUserId: me.user.id,
    senderName: me.user.name,
    requesterAppUserId: ticket.requesterId,
  });
  return NextResponse.json({ ok: true, status: newStatus });
}
