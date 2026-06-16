import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function loadOwned(id: string, userId: string, canConsultor: boolean) {
  const m = await prisma.ticketMessage.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!m) return { error: 404 as const };
  if (m.authorId !== userId && !canConsultor) return { error: 403 as const };
  return { m };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const r = await loadOwned(id, me.user.id, me.canConsultor);
  if ('error' in r) return NextResponse.json({ error: 'sem acesso' }, { status: r.error });

  const b = await req.json().catch(() => null);
  const text = (b?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'texto obrigatório' }, { status: 400 });
  await prisma.ticketMessage.update({ where: { id }, data: { text } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const r = await loadOwned(id, me.user.id, me.canConsultor);
  if ('error' in r) return NextResponse.json({ error: 'sem acesso' }, { status: r.error });
  await prisma.ticketMessage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
