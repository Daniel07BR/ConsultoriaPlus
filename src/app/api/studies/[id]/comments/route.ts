import { NextResponse } from 'next/server';
import { requireUser, resolveActingRole } from '@/lib/api';
import { prisma } from '@/lib/db';
import { notifyOnComment } from '@/lib/notify';
import { notifyNexusStudyAnswer, notifyNexusNeedsAnswer } from '@/lib/notify-nexus';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const b = await req.json().catch(() => null);
  const text = (b?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'texto obrigatório' }, { status: 400 });

  const study = await prisma.study.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!study) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });

  const role = resolveActingRole(me, b?.actingRole);
  const isQuestion = role === 'cliente' && !!b?.isQuestion;

  const comment = await prisma.comment.create({
    data: { studyId: id, authorId: me.user.id, role, text, isQuestion },
  });
  await notifyOnComment(id, { id: me.user.id, name: me.user.name }, isQuestion, role);

  // Resposta de consultor → alerta cross-system "pergunta respondida" no Nexus,
  // pra quem perguntou ver mesmo estando em outro sistema (sino + badge do card).
  if (role === 'consultor') {
    void notifyNexusStudyAnswer({
      studyId: id,
      studyTitle: study.title,
      answererNexusUserId: me.user.nexusUserId,
      answererAppUserId: me.user.id,
      answererName: me.user.name,
      commentId: comment.id,
    });
  } else if (isQuestion) {
    // Pergunta nova de cliente → alerta a equipe de consultores cross-system.
    void notifyNexusNeedsAnswer({
      kind: 'pergunta',
      refId: comment.id,
      title: study.title,
      requesterNexusUserId: me.user.nexusUserId,
      requesterAppUserId: me.user.id,
      requesterName: me.user.name,
    });
  }
  return NextResponse.json({ id: comment.id });
}
