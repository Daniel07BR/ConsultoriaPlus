import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { prisma } from '@/lib/db';
import { listTickets } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const status = req.nextUrl.searchParams.get('status') || undefined;
  const tickets = await listTickets(me, status);
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const b = await req.json().catch(() => null);
  const subject = (b?.subject || '').trim();
  if (!subject) return NextResponse.json({ error: 'assunto obrigatório' }, { status: 400 });
  const cats = await prisma.category.findMany({ orderBy: { position: 'asc' }, select: { name: true } });
  const names = cats.map((c) => c.name);
  const category = names.includes(b?.category) ? b.category : names[0] || 'Tributário';
  const body = (b?.body || '').trim() || subject;

  // Citação opcional de chamado anterior — valida existência e escopo (não cita o que não pode ver).
  let referenceId: string | null = null;
  const refReq = (b?.referenceId || '').trim();
  if (refReq) {
    const scope = me.canConsultor ? {} : { requesterId: me.user.id };
    const ref = await prisma.ticket.findFirst({ where: { id: refReq, ...scope }, select: { id: true } });
    referenceId = ref?.id ?? null;
  }

  const ticket = await prisma.ticket.create({
    data: {
      requesterId: me.user.id,
      subject,
      category,
      status: 'aberto',
      referenceId,
      messages: { create: [{ authorId: me.user.id, role: 'cliente', text: body }] },
    },
  });

  // (Sem push de comunicado ao Nexus: chamados/mensagens/comentários ficam só no
  // sino interno do Consultoria Plus. O Nexus só recebe comunicado de ESTUDO novo.)
  return NextResponse.json({ id: ticket.id });
}
