import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
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
