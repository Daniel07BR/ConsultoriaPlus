import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { counts } from '@/lib/queries';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const c = await counts(me);
  // Só as categorias do Feed de estudos; as do Feed de Gestão são carregadas à parte.
  const categories = await prisma.category.findMany({
    where: { feed: 'estudos' },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, color: true },
  });
  return NextResponse.json({
    user: {
      id: me.user.id,
      name: me.user.name,
      cargo: me.user.cargo,
      department: me.user.department,
      avatar: me.user.avatar,
    },
    role: me.role,
    canConsultor: me.canConsultor,
    canSwitch: me.canSwitch,
    canGestao: me.canGestao,
    isAdmin: me.isAdmin,
    defaultView: me.defaultView,
    counts: c,
    categories,
  });
}
