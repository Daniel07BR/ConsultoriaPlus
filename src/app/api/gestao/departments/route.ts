// Feed de Gestão: departamentos que compõem a audiência POR DEPARTAMENTO, ou seja,
// os que têm ao menos um Gestor/Sub-encarregado (os únicos afetados pela segmentação).
// Alimenta os toggles de audiência na tela de publicar. Só para quem acessa o feed.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { effectiveRole, isDeptScopedGestao } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  if (!me.canGestao) return NextResponse.json({ error: 'sem acesso ao feed de gestão' }, { status: 403 });

  const users = await prisma.appUser.findMany({
    where: { status: 'active', department: { not: null } },
    select: { department: true, cargo: true, baseRole: true, roleOverride: true },
  });

  const counts = new Map<string, number>();
  for (const u of users) {
    if (!isDeptScopedGestao(effectiveRole(u.baseRole, u.roleOverride), u.cargo)) continue;
    const d = (u.department ?? '').trim();
    if (!d) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }

  const departments = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return NextResponse.json({ departments });
}
