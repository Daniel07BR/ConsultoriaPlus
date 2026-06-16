// Webhook: Nexus avisa que um usuário deu ciência num comunicado deste sistema.
// Body: { announcementId, sourceRef, employeeId, readAt }
// Header X-Nexus-Webhook: <NEXUS_API_KEY deste sistema>  → validamos contra a env.
// sourceRef = study.id (foi o que mandamos no push). Marca StudyView origem=nexus.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const expected = process.env.NEXUS_API_KEY;
  const got = req.headers.get('x-nexus-webhook');
  if (!expected || got !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as {
    announcementId?: string;
    sourceRef?: string;
    employeeId?: string;
    readAt?: string;
  } | null;
  if (!body?.sourceRef || !body?.employeeId) {
    return NextResponse.json({ error: 'sourceRef e employeeId obrigatórios' }, { status: 400 });
  }

  const study = await prisma.study.findUnique({ where: { id: body.sourceRef }, select: { id: true } });
  if (!study) return NextResponse.json({ ok: true, ignored: 'study not found' });

  const user = await prisma.appUser.findUnique({
    where: { nexusUserId: body.employeeId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ ok: true, ignored: 'user not mirrored' });

  await prisma.studyView.upsert({
    where: { studyId_userId: { studyId: study.id, userId: user.id } },
    create: { studyId: study.id, userId: user.id, origin: 'nexus' },
    update: {}, // idempotente — não sobrescreve viewedAt nem origin local
  });

  return NextResponse.json({ ok: true });
}
