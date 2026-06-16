// GET  → lista quem viu o estudo, agrupado por departamento.
// POST → marca o usuário logado como viu (joinha) — idempotente.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const study = await prisma.study.findUnique({ where: { id }, select: { id: true } });
  if (!study) return NextResponse.json({ error: 'estudo não encontrado' }, { status: 404 });

  await prisma.studyView.upsert({
    where: { studyId_userId: { studyId: id, userId: me.user.id } },
    create: { studyId: id, userId: me.user.id, origin: 'local' },
    update: {},
  });

  const total = await prisma.studyView.count({ where: { studyId: id } });
  return NextResponse.json({ viewed: true, total });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const views = await prisma.studyView.findMany({
    where: { studyId: id },
    orderBy: { viewedAt: 'desc' },
    include: { user: { select: { name: true, avatar: true, department: true, cargo: true } } },
  });

  const groups = new Map<string, { department: string; users: { name: string; avatar: string | null; cargo: string | null; viewedAt: string }[] }>();
  for (const v of views) {
    const dept = v.user.department?.trim() || 'Sem departamento';
    const entry = groups.get(dept) ?? { department: dept, users: [] };
    entry.users.push({
      name: v.user.name,
      avatar: v.user.avatar,
      cargo: v.user.cargo,
      viewedAt: v.viewedAt.toISOString(),
    });
    groups.set(dept, entry);
  }

  const departments = Array.from(groups.values()).sort((a, b) => a.department.localeCompare(b.department, 'pt-BR'));
  const viewedByMe = views.some((v) => v.userId === me.user.id);

  return NextResponse.json({ total: views.length, viewedByMe, departments });
}
