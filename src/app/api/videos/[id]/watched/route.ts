import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { pushWatchedToClassroom } from '@/lib/classroom';

export const dynamic = 'force-dynamic';

// Marca/desmarca um vídeo como assistido pelo usuário logado. Registro local
// (instantâneo na UI) + push pro ClassRoom quando o vídeo veio de lá (auto-
// matrícula + XP, igual a assistir dentro do ClassRoom). Body: { watched?: boolean }.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id },
    select: { id: true, source: true, sourceRef: true },
  });
  if (!video) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });

  const b = await req.json().catch(() => null);
  const watched = b?.watched !== false; // default true

  if (watched) {
    await prisma.videoWatch.upsert({
      where: { videoId_userId: { videoId: id, userId: me.user.id } },
      update: { watchedAt: new Date() },
      create: { videoId: id, userId: me.user.id },
    });
  } else {
    await prisma.videoWatch.deleteMany({ where: { videoId: id, userId: me.user.id } });
  }

  // Reflete no ClassRoom (só vídeos de lá). Não bloqueia o registro local se falhar.
  let synced = false;
  if (video.source === 'classroom' && video.sourceRef && me.user.nexusUserId) {
    synced = await pushWatchedToClassroom(me.user.nexusUserId, video.sourceRef, watched);
  }

  return NextResponse.json({ ok: true, watched, synced });
}
