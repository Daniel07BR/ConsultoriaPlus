import { NextResponse } from 'next/server';
import { requireUser, ensureFeedAccess } from '@/lib/api';
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
  const denied = ensureFeedAccess(me, study.feed);
  if (denied) return denied;
  return NextResponse.json({ study });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const study = await prisma.study.findUnique({ where: { id }, select: { id: true, feed: true, authorId: true } });
  if (!study) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  const denied = ensureFeedAccess(me, study.feed);
  if (denied) return denied;
  // Editar: estudos → consultor/admin; gestão → só o próprio autor.
  const canEdit = study.feed === 'gestao' ? study.authorId === me.user.id : me.canConsultor;
  if (!canEdit) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });

  const b = await req.json().catch(() => null);
  const title = (b?.title || '').trim();
  if (!title) return NextResponse.json({ error: 'título obrigatório' }, { status: 400 });

  const cats = await prisma.category.findMany({ where: { feed: study.feed }, orderBy: { position: 'asc' }, select: { name: true } });
  const names = cats.map((c) => c.name);
  const category = names.includes(b?.category) ? b.category : names[0] || (study.feed === 'gestao' ? 'Geral' : 'Tributário');

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
  const { id } = await params;
  const study = await prisma.study.findUnique({ where: { id }, select: { id: true, feed: true, authorId: true } });
  if (!study) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  const denied = ensureFeedAccess(me, study.feed);
  if (denied) return denied;
  // Excluir: estudos → consultor/admin; gestão → o próprio autor OU diretoria/admin (base_role 'both').
  const canDelete = study.feed === 'gestao'
    ? study.authorId === me.user.id || me.user.baseRole === 'both'
    : me.canConsultor;
  if (!canDelete) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });
  await prisma.study.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
