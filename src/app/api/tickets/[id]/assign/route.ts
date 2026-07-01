import { NextResponse } from 'next/server';
import { requireUser, resolveActingRole } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Assumir / liberar o chamado (consultor responsável = "assumir o chamado").
// Aponta quem está atendendo mesmo antes de qualquer resposta. Só consultor/diretoria.
// Body: { release?: boolean, actingRole?: 'consultor'|'cliente' }.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  if (!me.canConsultor) return NextResponse.json({ error: 'sem permissão' }, { status: 403 });
  const { id } = await params;

  const t = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, status: true, assigneeId: true, assignee: { select: { name: true } } },
  });
  if (!t) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  if (t.status === 'fechado') return NextResponse.json({ error: 'chamado fechado' }, { status: 409 });

  const b = await req.json().catch(() => null);
  const role = resolveActingRole(me, b?.actingRole);
  const release = b?.release === true;
  const newAssigneeId = release ? null : me.user.id;

  // Sem mudança real (assumir o que já é meu / liberar o que já está livre) → no-op idempotente.
  if ((t.assigneeId ?? null) === newAssigneeId) return NextResponse.json({ ok: true });

  await prisma.ticket.update({
    where: { id },
    data: { assigneeId: newAssigneeId, assignedAt: newAssigneeId ? new Date() : null },
  });

  // Trilha de auditoria (messageId nulo), no mesmo padrão de título/citação.
  await prisma.ticketMessageRevision.create({
    data: {
      messageId: null,
      ticketId: id,
      action: release ? 'unassign' : 'assign',
      previousText: t.assignee ? t.assignee.name : 'Sem responsável',
      newText: release ? 'Liberado' : me.user.name,
      editorId: me.user.id,
      editorName: me.user.name,
      editorRole: role,
    },
  });

  return NextResponse.json({ ok: true });
}
