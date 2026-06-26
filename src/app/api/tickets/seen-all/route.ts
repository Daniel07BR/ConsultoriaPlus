// "Marcar todos como vistos": zera de uma vez os alertas de chamado do usuário.
// Registra a leitura de TODAS as mensagens da outra ponta (não excluídas) de todos
// os chamados que o usuário pode ver. Idempotente. A exibição do recibo "visto" para
// a outra ponta continua filtrada em getTicket (diretoria/admin não viram "visto").
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  // Escopo: cliente vê os próprios chamados; consultor/diretoria/admin veem todos.
  const ticketWhere = me.canConsultor ? {} : { requesterId: me.user.id };
  const tickets = await prisma.ticket.findMany({ where: ticketWhere, select: { id: true } });
  const ticketIds = tickets.map((t) => t.id);
  if (ticketIds.length === 0) return NextResponse.json({ ok: true, marked: 0 });

  const msgs = await prisma.ticketMessage.findMany({
    where: { ticketId: { in: ticketIds }, deletedAt: null, authorId: { not: me.user.id } },
    select: { id: true },
  });
  if (msgs.length) {
    await prisma.ticketMessageRead.createMany({
      data: msgs.map((m) => ({ messageId: m.id, userId: me.user.id })),
      skipDuplicates: true,
    });
  }
  return NextResponse.json({ ok: true, marked: msgs.length });
}
