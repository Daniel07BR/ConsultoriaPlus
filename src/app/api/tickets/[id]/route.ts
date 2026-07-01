import { NextResponse } from 'next/server';
import { requireUser, resolveActingRole } from '@/lib/api';
import { prisma } from '@/lib/db';
import { getTicket } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const ticket = await getTicket(me, id);
  if (!ticket) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  // Abrir o chamado baixa as notificações pendentes dele (auto-visto).
  await prisma.notification.updateMany({
    where: { userId: me.user.id, targetType: 'ticket', targetId: id, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ticket });
}

// Editar o chamado: título (subject) e citação de outro chamado (vincular/desvincular).
// Pode editar: o dono ou um consultor, enquanto o chamado não estiver fechado.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const t = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, requesterId: true, status: true, subject: true, referenceId: true, reference: { select: { number: true, subject: true } } },
  });
  if (!t) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  const isOwner = t.requesterId === me.user.id;
  if (!isOwner && !me.canConsultor) return NextResponse.json({ error: 'sem acesso' }, { status: 403 });
  if (t.status === 'fechado') return NextResponse.json({ error: 'chamado fechado' }, { status: 409 });

  const b = await req.json().catch(() => null);
  const role = resolveActingRole(me, b?.actingRole);
  const data: { subject?: string; referenceId?: string | null } = {};
  // Rótulo legível da citação, para a trilha de auditoria.
  let newRefLabel: string | null = null; // só usado quando referenceId muda

  if (b?.subject !== undefined) {
    const subject = (b.subject || '').trim();
    if (!subject) return NextResponse.json({ error: 'título obrigatório' }, { status: 400 });
    if (subject !== t.subject) data.subject = subject;
  }

  // referenceId: string → vincular (valida escopo e evita auto-referência); null → desvincular.
  if (b?.referenceId !== undefined) {
    const ref = (b.referenceId || '').trim();
    if (!ref) {
      if (t.referenceId) { data.referenceId = null; newRefLabel = 'Sem citação'; }
    } else if (ref === id) {
      return NextResponse.json({ error: 'um chamado não pode citar a si mesmo' }, { status: 400 });
    } else if (ref !== t.referenceId) {
      const scope = me.canConsultor ? {} : { requesterId: me.user.id };
      const found = await prisma.ticket.findFirst({ where: { id: ref, ...scope }, select: { id: true, number: true, subject: true } });
      if (found) { data.referenceId = found.id; newRefLabel = `#${found.number} · ${found.subject}`; }
    }
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ ok: true });

  await prisma.ticket.update({ where: { id }, data });

  // Trilha de auditoria do chamado (messageId nulo): registra título e/ou citação.
  if (data.subject !== undefined) {
    await prisma.ticketMessageRevision.create({
      data: {
        messageId: null, ticketId: id, action: 'title',
        previousText: t.subject, newText: data.subject,
        editorId: me.user.id, editorName: me.user.name, editorRole: role,
      },
    });
  }
  if (data.referenceId !== undefined) {
    const oldLabel = t.reference ? `#${t.reference.number} · ${t.reference.subject}` : 'Sem citação';
    await prisma.ticketMessageRevision.create({
      data: {
        messageId: null, ticketId: id, action: 'reference',
        previousText: oldLabel, newText: newRefLabel ?? 'Sem citação',
        editorId: me.user.id, editorName: me.user.name, editorRole: role,
      },
    });
  }
  return NextResponse.json({ ok: true });
}
