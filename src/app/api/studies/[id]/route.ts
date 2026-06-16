import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { getStudy } from '@/lib/queries';
import { linkKind, linkLabel } from '@/lib/present';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const study = await getStudy(me, id);
  if (!study) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  return NextResponse.json({ study });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  if (!me.canConsultor) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });
  const { id } = await params;

  const study = await prisma.study.findUnique({ where: { id }, select: { id: true } });
  if (!study) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });

  const b = await req.json().catch(() => null);
  const title = (b?.title || '').trim();
  if (!title) return NextResponse.json({ error: 'título obrigatório' }, { status: 400 });

  const cats = await prisma.category.findMany({ orderBy: { position: 'asc' }, select: { name: true } });
  const names = cats.map((c) => c.name);
  const category = names.includes(b?.category) ? b.category : names[0] || 'Tributário';

  const bodyText: string = (b?.body || '').trim();
  const paras = bodyText ? bodyText.split(/\n{1,}/).map((p: string) => p.trim()).filter(Boolean) : ['(sem conteúdo)'];
  const readTime = `${Math.max(1, Math.round(bodyText.length / 800))} min`;
  const coverImage = typeof b?.coverImage === 'string' && b.coverImage.startsWith('data:image/') ? b.coverImage : b?.coverImage === null ? null : undefined;

  const links: { kind: string; name: string; url: string }[] = [];
  if (Array.isArray(b?.links)) {
    for (const l of b.links) {
      const url = String(l?.url || l?.name || '').trim();
      if (!url) continue;
      links.push({ kind: linkKind(url), name: linkLabel(url, l?.name && l.name !== url ? l.name : undefined), url });
    }
  }

  await prisma.$transaction([
    prisma.study.update({
      where: { id },
      data: { title, category, body: paras.join('\n\n'), readTime, ...(coverImage !== undefined ? { coverImage } : {}) },
    }),
    prisma.studyAttachment.deleteMany({ where: { studyId: id } }),
    ...(links.length ? [prisma.studyAttachment.createMany({ data: links.map((l) => ({ ...l, studyId: id })) })] : []),
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  if (!me.canConsultor) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });
  const { id } = await params;
  const study = await prisma.study.findUnique({ where: { id }, select: { id: true } });
  if (!study) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  await prisma.study.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
