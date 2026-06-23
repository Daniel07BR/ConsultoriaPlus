import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { listNotifications } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const sp = req.nextUrl.searchParams;
  const limit = sp.get('limit') ? parseInt(sp.get('limit')!, 10) : undefined;
  const offset = sp.get('offset') ? parseInt(sp.get('offset')!, 10) : undefined;
  const { notifications, total } = await listNotifications(me, { limit, offset });
  return NextResponse.json({ notifications, total });
}
