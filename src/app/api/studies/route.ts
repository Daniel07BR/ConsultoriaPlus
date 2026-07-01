import { NextRequest, NextResponse } from 'next/server';
import { requireUser, ensureFeedAccess } from '@/lib/api';
import { prisma } from '@/lib/db';
import { listStudies } from '@/lib/queries';
import { linkKind, linkLabel } from '@/lib/present';
import { notifyNexusAboutStudy, notifyNexusAboutGestaoStudy } from '@/lib/notify-nexus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const sp = req.nextUrl.searchParams;
  const feed = sp.get('feed') === 'gestao' ? 'gestao' : 'estudos';
  const savedOnly = sp.get('saved') === 'true';
  // Listar o feed de gestão exige acesso (salvos é global e não filtra por feed).
  if (feed === 'gestao' && !savedOnly) {
    const denied = ensureFeedAccess(me, 'gestao');
    if (denied) return denied;
  }
  const limit = parseInt(sp.get('limit') || '', 10);
  const offset = parseInt(sp.get('offset') || '', 10);
  const { studies, total } = await listStudies(me, {
    filter: sp.get('filter') || undefined,
    search: sp.get('search') || undefined,
    savedOnly,
    from: sp.get('from') || undefined,
    to: sp.get('to') || undefined,
    feed,
    limit: Number.isInteger(limit) ? limit : undefined,
    offset: Number.isInteger(offset) ? offset : undefined,
  });
  return NextResponse.json({ studies, total });
}

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  const b = await req.json().catch(() => null);
  const feed = b?.feed === 'gestao' ? 'gestao' : 'estudos';
  // Permissão por feed: estudos → só consultor/admin; gestão → quem tem acesso ao feed.
  if (feed === 'gestao') {
    if (!me.canGestao) return NextResponse.json({ error: 'sem acesso ao feed de gestão' }, { status: 403 });
  } else {
    if (!me.canConsultor) return NextResponse.json({ error: 'apenas consultores publicam estudos' }, { status: 403 });
  }

  const title = (b?.title || '').trim();
  if (!title) return NextResponse.json({ error: 'título obrigatório' }, { status: 400 });

  // categoria validada contra o banco do MESMO feed (cai na 1ª se inválida)
  const cats = await prisma.category.findMany({ where: { feed }, orderBy: { position: 'asc' }, select: { name: true } });
  const names = cats.map((c) => c.name);
  const category = names.includes(b?.category) ? b.category : names[0] || (feed === 'gestao' ? 'Geral' : 'Tributário');

  const bodyText: string = (b?.body || '').trim();
  const paras = bodyText ? bodyText.split(/\n{1,}/).map((p: string) => p.trim()).filter(Boolean) : ['(sem conteúdo)'];
  const readTime = `${Math.max(1, Math.round(bodyText.length / 800))} min`;

  const coverImage = typeof b?.coverImage === 'string' && b.coverImage.startsWith('data:image/') ? b.coverImage : null;
  // Audiência por departamento (só Feed de Gestão): departamentos ocultos desta publicação.
  const excludedDepartments = feed === 'gestao' && Array.isArray(b?.excludedDepartments)
    ? b.excludedDepartments.map((d: unknown) => String(d).trim()).filter(Boolean)
    : [];

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
      feed,
      excludedDepartments,
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
  // Estudo → todos com acesso ao sistema; Gestão → só quem acessa o feed de gestão.
  if (feed === 'gestao') {
    void notifyNexusAboutGestaoStudy({
      studyId: study.id,
      authorNexusUserId: me.user.nexusUserId,
      title,
      body: paras.join('\n\n'),
      category,
      authorAvatar: me.user.avatar, // foto de perfil do autor vira a imagem do comunicado
      excludedDepartments, // não avisa Gestor/Sub dos deptos ocultos
    });
  } else {
    void notifyNexusAboutStudy({
      studyId: study.id,
      authorNexusUserId: me.user.nexusUserId,
      title,
      body: paras.join('\n\n'),
      category,
    });
  }

  return NextResponse.json({ id: study.id });
}
