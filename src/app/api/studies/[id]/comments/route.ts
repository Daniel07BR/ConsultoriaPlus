import { NextResponse } from 'next/server';
import { requireUser, resolveActingRole, ensureStudyAccess } from '@/lib/api';
import { prisma } from '@/lib/db';
import { notifyOnComment } from '@/lib/notify';
import { notifyNexusStudyAnswer } from '@/lib/notify-nexus';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const b = await req.json().catch(() => null);
  const text = (b?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'texto obrigatório' }, { status: 400 });

  const study = await prisma.study.findUnique({ where: { id }, select: { id: true, title: true, feed: true, authorId: true, excludedDepartments: true } });
  if (!study) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  const denied = ensureStudyAccess(me, study);
  if (denied) return denied;

  const role = resolveActingRole(me, b?.actingRole);
  const isQuestion = role === 'cliente' && !!b?.isQuestion;

  const comment = await prisma.comment.create({
    data: { studyId: id, authorId: me.user.id, role, text, isQuestion },
  });
  await notifyOnComment(id, comment.id, { id: me.user.id, name: me.user.name }, isQuestion, role, study.feed);

  // Alerta cross-system no Nexus: quando a consultoria RESPONDE (comentário de
  // consultor), avisa QUEM PERGUNTOU na publicação (sino embutido do Nexus). Vale
  // p/ os dois feeds (estudos e gestão). Perguntas novas não alertam consultores aqui.
  if (role === 'consultor') {
    void notifyNexusStudyAnswer({
      studyId: id,
      studyTitle: study.title,
      feed: study.feed,
      answererNexusUserId: me.user.nexusUserId,
      answererAppUserId: me.user.id,
      answererName: me.user.name,
      commentId: comment.id,
    });
  }
  return NextResponse.json({ id: comment.id });
}
