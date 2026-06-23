import { NextResponse } from 'next/server';
import { requireUser, resolveActingRole } from '@/lib/api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Edição: só o próprio autor edita a sua mensagem. Cada alteração é registrada
// na trilha de auditoria (texto anterior → novo).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const m = await prisma.ticketMessage.findUnique({
    where: { id },
    select: { id: true, ticketId: true, authorId: true, role: true, text: true, deletedAt: true },
  });
  if (!m) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  if (m.authorId !== me.user.id) return NextResponse.json({ error: 'só o autor pode editar' }, { status: 403 });
  if (m.deletedAt) return NextResponse.json({ error: 'mensagem excluída' }, { status: 409 });

  const b = await req.json().catch(() => null);
  const text = (b?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'texto obrigatório' }, { status: 400 });
  if (text === m.text) return NextResponse.json({ ok: true }); // nada mudou

  await prisma.$transaction([
    prisma.ticketMessageRevision.create({
      data: {
        messageId: m.id, ticketId: m.ticketId, action: 'edit',
        previousText: m.text, newText: text, editorId: me.user.id,
        editorName: me.user.name, editorRole: m.role,
      },
    }),
    prisma.ticketMessage.update({ where: { id }, data: { text, editedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}

// Exclusão suave: marca como excluída (com motivo e autor da exclusão) em vez de
// apagar. Consultor pode excluir qualquer mensagem; o autor pode excluir a sua.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const m = await prisma.ticketMessage.findUnique({
    where: { id },
    select: { id: true, ticketId: true, authorId: true, text: true, deletedAt: true },
  });
  if (!m) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  if (m.authorId !== me.user.id && !me.canConsultor) {
    return NextResponse.json({ error: 'sem acesso' }, { status: 403 });
  }
  if (m.deletedAt) return NextResponse.json({ error: 'já excluída' }, { status: 409 });

  const b = await req.json().catch(() => null);
  const reason = (b?.reason || '').trim() || 'Sem motivo informado';
  const role = resolveActingRole(me, b?.actingRole);

  await prisma.$transaction([
    prisma.ticketMessageRevision.create({
      data: {
        messageId: m.id, ticketId: m.ticketId, action: 'delete',
        previousText: m.text, reason, editorId: me.user.id,
        editorName: me.user.name, editorRole: role,
      },
    }),
    prisma.ticketMessage.update({
      where: { id },
      data: {
        deletedAt: new Date(), deletedById: me.user.id,
        deletedByName: me.user.name, deletedByRole: role, deleteReason: reason,
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
