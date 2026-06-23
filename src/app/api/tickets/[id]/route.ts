import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { getTicket } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const ticket = await getTicket(me, id);
  if (!ticket) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  return NextResponse.json({ ticket });
}

// Editar o chamado: título (subject) e citação de outro chamado (vincular/desvincular).
// Pode editar: o dono ou um consultor, enquanto o chamado não estiver fechado.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const { id } = await params;

  const t = await prisma.ticket.findUnique({ where: { id }, select: { id: true, requesterId: true, status: true } });
  if (!t) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  const isOwner = t.requesterId === me.user.id;
  if (!isOwner && !me.canConsultor) return NextResponse.json({ error: 'sem acesso' }, { status: 403 });
  if (t.status === 'fechado') return NextResponse.json({ error: 'chamado fechado' }, { status: 409 });

  const b = await req.json().catch(() => null);
  const data: { subject?: string; referenceId?: string | null } = {};

  if (b?.subject !== undefined) {
    const subject = (b.subject || '').trim();
    if (!subject) return NextResponse.json({ error: 'título obrigatório' }, { status: 400 });
    data.subject = subject;
  }

  // referenceId: string → vincular (valida escopo e evita auto-referência); null → desvincular.
  if (b?.referenceId !== undefined) {
    const ref = (b.referenceId || '').trim();
    if (!ref) {
      data.referenceId = null;
    } else if (ref === id) {
      return NextResponse.json({ error: 'um chamado não pode citar a si mesmo' }, { status: 400 });
    } else {
      const scope = me.canConsultor ? {} : { requesterId: me.user.id };
      const found = await prisma.ticket.findFirst({ where: { id: ref, ...scope }, select: { id: true } });
      data.referenceId = found?.id ?? null;
    }
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ ok: true });
  await prisma.ticket.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
