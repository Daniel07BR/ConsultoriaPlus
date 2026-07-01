// Perguntas em aberto (não respondidas) das publicações que o usuário acessa.
// Visão ao vivo (comentários), alimenta a seção destacada do inbox. Só consultor.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { listOpenQuestions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;
  const items = await listOpenQuestions(me);
  return NextResponse.json({ items });
}
