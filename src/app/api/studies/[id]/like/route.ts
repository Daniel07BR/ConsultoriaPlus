import { NextResponse } from 'next/server';
import { requireUser, ensureFeedAccess } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const study = await prisma.study.findUnique({ where: { id }, select: { feed: true } });
  if (!study) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  const denied = ensureFeedAccess(me, study.feed);
  if (denied) return denied;
  const key = { studyId_userId: { studyId: id, userId: me.user.id } };
  const existing = await prisma.studyLike.findUnique({ where: key });
  let liked: boolean;
  if (existing) {
    await prisma.studyLike.delete({ where: key });
    liked = false;
  } else {
    await prisma.studyLike.create({ data: { studyId: id, userId: me.user.id } });
    liked = true;
  }
  const likes = await prisma.studyLike.count({ where: { studyId: id } });
  return NextResponse.json({ liked, likes });
}

// Lista quem curtiu o estudo (nome + foto), do mais recente ao mais antigo.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const study = await prisma.study.findUnique({ where: { id }, select: { feed: true } });
  if (!study) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  const denied = ensureFeedAccess(me, study.feed);
  if (denied) return denied;
  const rows = await prisma.studyLike.findMany({
    where: { studyId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, avatar: true, department: true } } },
  });
  return NextResponse.json({
    total: rows.length,
    users: rows.map((r) => ({ name: r.user.name, avatar: r.user.avatar, department: r.user.department })),
  });
}
