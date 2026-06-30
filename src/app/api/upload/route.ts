// Upload de imagem com otimização automática (resize + WebP) via sharp.
// Retorna data URI WebP — guardado direto no estudo (cover). Mantém o payload leve.
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireUser } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB de entrada

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  const form = await req.formData().catch(() => null);
  // Permissão por feed: gestão → quem tem acesso ao feed; estudos → consultor/admin.
  const feed = form?.get('feed') === 'gestao' ? 'gestao' : 'estudos';
  const allowed = feed === 'gestao' ? me.canGestao : me.canConsultor;
  if (!allowed) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });

  const file = form?.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'arquivo obrigatório' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'apenas imagens' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'imagem muito grande (máx 12MB)' }, { status: 413 });
  }

  const input = Buffer.from(await file.arrayBuffer());
  // Capa: máx 1600px de largura, WebP q80, achata orientação EXIF.
  const out = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const dataUri = `data:image/webp;base64,${out.toString('base64')}`;
  return NextResponse.json({ dataUri, bytes: out.length });
}
