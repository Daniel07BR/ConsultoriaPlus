import { NextResponse } from 'next/server';
import { requireUser, resolveActingRole } from '@/lib/api';
import { prisma } from '@/lib/db';
import { notifyOnComment } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const b = await req.json().catch(() => null);
  const text = (b?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'texto obrigatório' }, { status: 400 });

  const study = await prisma.study.findUnique({ where: { id }, select: { id: true } });
  if (!study) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });

  const role = resolveActingRole(me, b?.actingRole);
  const isQuestion = role === 'cliente' && !!b?.isQuestion;

  const comment = await prisma.comment.create({
    data: { studyId: id, authorId: me.user.id, role, text, isQuestion },
  });
  await notifyOnComment(id, { id: me.user.id, name: me.user.name }, isQuestion, role);
  return NextResponse.json({ id: comment.id });
}
