import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { youtubeId } from '@/lib/present';

export const dynamic = 'force-dynamic';

const TABS = ['treinamento', 'sugerido'];

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const tab = req.nextUrl.searchParams.get('tab') || undefined;
  const where = tab && TABS.includes(tab) ? { tab } : {};
  const videos = await prisma.video.findMany({
    where,
    orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    include: {
      author: { select: { name: true, avatar: true } },
      watches: { where: { userId: me.user.id }, select: { videoId: true } },
    },
  });
  return NextResponse.json({
    videos: videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      url: v.url,
      youtubeId: v.youtubeId,
      thumbUrl: v.thumbUrl,
      tab: v.tab,
      source: v.source,
      courseTitle: v.courseTitle,
      sourceUrl: v.sourceUrl,
      watched: v.watches.length > 0,
      author: v.author ? { name: v.author.name, avatar: v.author.avatar } : null,
      createdAt: v.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  if (!me.canConsultor) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });

  const b = await req.json().catch(() => null);
  const title = (b?.title || '').trim();
  if (!title) return NextResponse.json({ error: 'título obrigatório' }, { status: 400 });
  const url = String(b?.url || '').trim();
  const yid = youtubeId(url);
  if (!yid) return NextResponse.json({ error: 'informe um link válido do YouTube' }, { status: 400 });
  const tab = TABS.includes(b?.tab) ? b.tab : 'treinamento';

  const max = await prisma.video.aggregate({ where: { tab }, _max: { position: true } });
  const video = await prisma.video.create({
    data: { title, description: (b?.description || '').trim() || null, url, youtubeId: yid, tab, authorId: me.user.id, position: (max._max.position ?? 0) + 1 },
  });
  return NextResponse.json({ id: video.id });
}
