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
  const existing = await prisma.studySave.findUnique({ where: key });
  let saved: boolean;
  if (existing) {
    await prisma.studySave.delete({ where: key });
    saved = false;
  } else {
    await prisma.studySave.create({ data: { studyId: id, userId: me.user.id } });
    saved = true;
  }
  return NextResponse.json({ saved });
}
