import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const feed = req.nextUrl.searchParams.get('feed') === 'gestao' ? 'gestao' : 'estudos';
  if (feed === 'gestao' && !me.canGestao) return NextResponse.json({ error: 'sem acesso' }, { status: 403 });
  const categories = await prisma.category.findMany({ where: { feed }, orderBy: [{ position: 'asc' }, { name: 'asc' }] });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  const b = await req.json().catch(() => null);
  const feed = b?.feed === 'gestao' ? 'gestao' : 'estudos';
  // Gerir categorias: estudos → consultor/admin; gestão → quem tem acesso ao feed.
  const allowed = feed === 'gestao' ? me.canGestao : me.canConsultor;
  if (!allowed) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });

  const name = (b?.name || '').trim();
  if (!name) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 });
  const color = /^#[0-9a-fA-F]{6}$/.test(b?.color) ? b.color : '#ff5c89';

  const exists = await prisma.category.findUnique({ where: { feed_name: { feed, name } } });
  if (exists) return NextResponse.json({ error: 'categoria já existe' }, { status: 409 });

  const max = await prisma.category.aggregate({ where: { feed }, _max: { position: true } });
  const category = await prisma.category.create({
    data: { name, feed, color, position: (max._max.position ?? 0) + 1 },
  });
  return NextResponse.json({ category });
}
