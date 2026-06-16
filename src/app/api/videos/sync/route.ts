import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { syncClassroomVideos } from '@/lib/classroom';

export const dynamic = 'force-dynamic';

// Sincroniza os vídeos da categoria Consultoria do ClassRoom (espelho fiel).
// Autorizado por: (a) sessão de consultor/admin (botão "Sincronizar" na UI) OU
// (b) X-Integration-Key (timer de reconciliação periódica chamando localhost).
export async function POST(req: NextRequest) {
  const key = req.headers.get('x-integration-key');
  const expected = process.env.CLASSROOM_INTEGRATION_KEY ?? '';
  const machine = !!expected && key === expected;

  if (!machine) {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;
    if (!me.canConsultor) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });
  }

  try {
    const result = await syncClassroomVideos();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[classroom] sync falhou:', e);
    return NextResponse.json({ error: 'falha ao sincronizar com o ClassRoom' }, { status: 502 });
  }
}
