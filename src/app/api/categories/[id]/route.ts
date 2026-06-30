import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return NextResponse.json({ error: 'não encontrada' }, { status: 404 });
  const allowed = cat.feed === 'gestao' ? me.canGestao : me.canConsultor;
  if (!allowed) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });

  const b = await req.json().catch(() => null);
  const name = (b?.name ?? cat.name).trim();
  if (!name) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 });
  const color = /^#[0-9a-fA-F]{6}$/.test(b?.color) ? b.color : cat.color;

  if (name !== cat.name) {
    const clash = await prisma.category.findUnique({ where: { feed_name: { feed: cat.feed, name } } });
    if (clash) return NextResponse.json({ error: 'já existe uma categoria com esse nome' }, { status: 409 });
  }

  // Renomear → propaga só dentro do MESMO feed; chamados só existem no mundo "estudos".
  await prisma.$transaction([
    prisma.category.update({ where: { id }, data: { name, color } }),
    ...(name !== cat.name
      ? [
          prisma.study.updateMany({ where: { category: cat.name, feed: cat.feed }, data: { category: name } }),
          ...(cat.feed === 'estudos'
            ? [prisma.ticket.updateMany({ where: { category: cat.name }, data: { category: name } })]
            : []),
        ]
      : []),
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return NextResponse.json({ error: 'não encontrada' }, { status: 404 });
  const allowed = cat.feed === 'gestao' ? me.canGestao : me.canConsultor;
  if (!allowed) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });

  const inUse =
    (await prisma.study.count({ where: { category: cat.name, feed: cat.feed } })) +
    (cat.feed === 'estudos' ? await prisma.ticket.count({ where: { category: cat.name } }) : 0);
  if (inUse > 0) {
    return NextResponse.json({ error: `em uso por ${inUse} registro(s)`, inUse }, { status: 409 });
  }
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
