import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { listNotifications } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const notifications = await listNotifications(me);
  return NextResponse.json({ notifications });
}
