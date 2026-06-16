import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { listStudies } from '@/lib/queries';
import { linkKind, linkLabel } from '@/lib/present';
import { notifyNexusAboutStudy } from '@/lib/notify-nexus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const sp = req.nextUrl.searchParams;
  const studies = await listStudies(me, {
    filter: sp.get('filter') || undefined,
    search: sp.get('search') || undefined,
    savedOnly: sp.get('saved') === 'true',
    from: sp.get('from') || undefined,
    to: sp.get('to') || undefined,
  });
  return NextResponse.json({ studies });
}

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  if (!me.canConsultor) return NextResponse.json({ error: 'apenas consultores publicam estudos' }, { status: 403 });

  const b = await req.json().catch(() => null);
  const title = (b?.title || '').trim();
  if (!title) return NextResponse.json({ error: 'título obrigatório' }, { status: 400 });

  // categoria validada contra o banco (cai na 1ª se inválida)
  const cats = await prisma.category.findMany({ orderBy: { position: 'asc' }, select: { name: true } });
  const names = cats.map((c) => c.name);
  const category = names.includes(b?.category) ? b.category : names[0] || 'Tributário';

  const bodyText: string = (b?.body || '').trim();
  const paras = bodyText ? bodyText.split(/\n{1,}/).map((p: string) => p.trim()).filter(Boolean) : ['(sem conteúdo)'];
  const readTime = `${Math.max(1, Math.round(bodyText.length / 800))} min`;

  const coverImage = typeof b?.coverImage === 'string' && b.coverImage.startsWith('data:image/') ? b.coverImage : null;

  const attachments: { kind: string; name: string; meta?: string; url?: string }[] = [];
  // Links (YouTube / Drive / site) — tipo detectado no servidor.
  if (Array.isArray(b?.links)) {
    for (const l of b.links) {
      const url = String(l?.url || l?.name || '').trim();
      if (!url) continue;
      attachments.push({ kind: linkKind(url), name: linkLabel(url, l?.name && l.name !== url ? l.name : undefined), url });
    }
  }

  const study = await prisma.study.create({
    data: {
      authorId: me.user.id,
      category,
      title,
      body: paras.join('\n\n'),
      coverImage,
      readTime,
      attachments: { create: attachments },
    },
  });

  // Empurra como comunicado no Nexus (aba "Consultoria Plus" em /comunicados,
  // gate de leitura no portal, e ack volta como visualização aqui via webhook).
  void notifyNexusAboutStudy({
    studyId: study.id,
    authorNexusUserId: me.user.nexusUserId,
    title,
    body: paras.join('\n\n'),
    category,
  });

  return NextResponse.json({ id: study.id });
}
