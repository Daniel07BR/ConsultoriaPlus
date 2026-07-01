import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function loadOwned(id: string, userId: string, canConsultor: boolean) {
  const c = await prisma.comment.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!c) return { error: 404 as const };
  if (c.authorId !== userId && !canConsultor) return { error: 403 as const };
  return { c };
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
  await prisma.comment.update({ where: { id }, data: { text } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const r = await loadOwned(id, me.user.id, me.canConsultor);
  if ('error' in r) return NextResponse.json({ error: 'sem acesso' }, { status: r.error });
  // Remove também as notificações desse comentário/pergunta — o alerta some junto
  // (some do inbox e zera o contador de "em aberto"/"não lido").
  await prisma.notification.deleteMany({ where: { commentId: id } });
  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
