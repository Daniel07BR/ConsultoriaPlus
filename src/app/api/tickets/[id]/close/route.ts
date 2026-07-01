// Fechar + avaliar o chamado (só o cliente que abriu). Avaliação 1..5 com rótulo.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { RATING_LABELS } from '@/lib/present';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true, subject: true, requesterId: true, status: true } });
  if (!ticket) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  if (ticket.requesterId !== me.user.id) return NextResponse.json({ error: 'só quem abriu pode fechar' }, { status: 403 });
  if (ticket.status === 'fechado') return NextResponse.json({ error: 'já está fechado' }, { status: 409 });

  const b = await req.json().catch(() => null);
  const rating = Number(b?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'avaliação de 1 a 5 obrigatória' }, { status: 400 });
  }
  const label = RATING_LABELS[rating];

  await prisma.ticket.update({
    where: { id },
    data: { status: 'fechado', rating, ratingLabel: label, closedAt: new Date() },
  });
  return NextResponse.json({ ok: true, rating, label });
}
