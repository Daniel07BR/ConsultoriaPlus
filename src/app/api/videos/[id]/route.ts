import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { youtubeId } from '@/lib/present';

export const dynamic = 'force-dynamic';
const TABS = ['treinamento', 'sugerido'];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  if (!me.canConsultor) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });
  const { id } = await params;

  const v = await prisma.video.findUnique({ where: { id }, select: { id: true, source: true } });
  if (!v) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });

  const b = await req.json().catch(() => null);
  const tab = TABS.includes(b?.tab) ? b.tab : 'treinamento';

  // Vídeo vindo do ClassRoom: título/url são geridos pela origem e re-sincronizam.
  // Aqui só se reclassifica a aba (sugerido <-> treinamento).
  if (v.source === 'classroom') {
    await prisma.video.update({ where: { id }, data: { tab } });
    return NextResponse.json({ ok: true });
  }

  const title = (b?.title || '').trim();
  if (!title) return NextResponse.json({ error: 'título obrigatório' }, { status: 400 });
  const url = String(b?.url || '').trim();
  const yid = youtubeId(url);
  if (!yid) return NextResponse.json({ error: 'link do YouTube inválido' }, { status: 400 });

  await prisma.video.update({
    where: { id },
    data: { title, description: (b?.description || '').trim() || null, url, youtubeId: yid, tab },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  if (!me.canConsultor) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });
  const { id } = await params;
  const v = await prisma.video.findUnique({ where: { id }, select: { id: true } });
  if (!v) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
