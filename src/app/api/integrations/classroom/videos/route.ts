import { NextRequest, NextResponse } from 'next/server';
import { upsertClassroomVideo, type ClassroomVideoDTO } from '@/lib/classroom';

export const dynamic = 'force-dynamic';

// Receptor do push imediato do ClassRoom: ingere um vídeo novo da categoria
// Consultoria. Idempotente por sourceRef. Autenticado pela chave do canal.
export async function POST(req: NextRequest) {
  const key = req.headers.get('x-integration-key');
  const expected = process.env.CLASSROOM_INTEGRATION_KEY ?? '';
  if (!expected || key !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as ClassroomVideoDTO | null;
  if (!body?.sourceRef || !body?.youtubeUrl) {
    return NextResponse.json({ error: 'payload inválido' }, { status: 400 });
  }

  try {
    const result = await upsertClassroomVideo(body);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error('[classroom] erro ao ingerir vídeo:', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
