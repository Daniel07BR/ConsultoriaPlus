import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  await prisma.notification.updateMany({ where: { userId: me.user.id, read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
