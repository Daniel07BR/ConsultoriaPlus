// Departamentos que compõem a AUDIÊNCIA por departamento de cada feed, p/ os toggles
// da tela de publicar + o conjunto que já vem DESATIVADO por padrão.
//  - gestão: deptos com Gestor/Sub-encarregado (os afetados pela segmentação); padrão = nenhum oculto.
//  - estudos: deptos com ao menos um cliente; padrão desativado = ESTUDOS_DEFAULT_EXCLUDED_DEPARTMENTS
//    (TI, Recepção, Imóveis, Marketing, Programação) — o consultor ativa se quiser.
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { effectiveRole, isDeptScopedGestao, isDeptFiltered } from '@/lib/roles';

export const dynamic = 'force-dynamic';

function parseList(env?: string): string[] {
  return (env ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}
const ESTUDOS_DEFAULT_EXCLUDED = parseList(
  process.env.ESTUDOS_DEFAULT_EXCLUDED_DEPARTMENTS || 'TI,Recepção,Imóveis,Marketing,Programação',
);

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const feed = req.nextUrl.searchParams.get('feed') === 'gestao' ? 'gestao' : 'estudos';
  // Quem publica: gestão → canGestao; estudos → só consultor/admin.
  if (feed === 'gestao' ? !me.canGestao : !me.canConsultor) {
    return NextResponse.json({ error: 'sem permissão' }, { status: 403 });
  }

  const users = await prisma.appUser.findMany({
    where: { status: 'active', department: { not: null } },
    select: { department: true, cargo: true, baseRole: true, roleOverride: true },
  });

  const counts = new Map<string, number>();
  for (const u of users) {
    const role = effectiveRole(u.baseRole, u.roleOverride);
    const inAudience = feed === 'gestao' ? isDeptScopedGestao(role, u.cargo) : isDeptFiltered(role);
    if (!inAudience) continue;
    const d = (u.department ?? '').trim();
    if (!d) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }

  const departments = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // Padrão desativado (só estudos): mapeia p/ o NOME CANÔNICO do banco (casa com o has()).
  const defaultExcluded = feed === 'estudos'
    ? departments
        .filter((d) => ESTUDOS_DEFAULT_EXCLUDED.some((n) => n.toLowerCase() === d.name.toLowerCase()))
        .map((d) => d.name)
    : [];

  return NextResponse.json({ departments, defaultExcluded });
}
