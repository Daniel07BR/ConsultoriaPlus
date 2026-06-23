// Marca como lidas (recibo de leitura) as mensagens do chamado que NÃO são do
// usuário atual. Idempotente. Chamado ao abrir o chamado e a cada atualização.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  // Só pode marcar quem tem acesso ao chamado (dono ou consultor/diretoria/admin).
  const t = await prisma.ticket.findUnique({ where: { id }, select: { requesterId: true } });
  if (!t) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  if (t.requesterId !== me.user.id && !me.canConsultor) {
    return NextResponse.json({ error: 'sem acesso' }, { status: 403 });
  }

  // O recibo de leitura só vale para o CLIENTE dono do chamado (confirma que viu a
  // resposta) e para CONSULTORES de verdade (depto Consultoria). Diretoria/admin
  // têm acesso total mas NÃO são consultores → não "consomem" o visto.
  const isRealConsultor = me.role === 'consultor';
  const canRecordRead = t.requesterId === me.user.id || isRealConsultor;
  if (!canRecordRead) return NextResponse.json({ ok: true, recorded: false });

  const msgs = await prisma.ticketMessage.findMany({
    where: { ticketId: id, deletedAt: null, authorId: { not: me.user.id } },
    select: { id: true },
  });
  if (msgs.length) {
    await prisma.ticketMessageRead.createMany({
      data: msgs.map((m) => ({ messageId: m.id, userId: me.user.id })),
      skipDuplicates: true,
    });
  }
  return NextResponse.json({ ok: true });
}
