import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Endpoint de integração (frente B do TalentCare): atividade do Consultoria Plus
// por (nexus_user_id, dia America/Sao_Paulo). Quatro métricas, todas por createdAt:
//   - studies  : estudos publicados (Study.author)
//   - tickets  : chamados abertos (Ticket.requester)
//   - messages : mensagens em chamados (TicketMessage.author)
//   - comments : comentários em estudos (Comment.author)
// Espelho diário consumido pelo TalentCare (upsert SET por usuário×dia → idempotente:
// re-puxar um dia dá o total correto daquele dia). Auth: X-API-Key.
const KEY = process.env.TALENTCARE_INTEGRATION_KEY ?? '';

function keyOk(provided: string | null): boolean {
  if (!provided || !KEY) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type Row = {
  nexus_user_id: string;
  day: string;
  studies: number;
  tickets: number;
  messages: number;
  comments: number;
};

export async function GET(req: NextRequest) {
  if (!keyOk(req.headers.get('x-api-key'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const fromParam = req.nextUrl.searchParams.get('from');
  const toParam = req.nextUrl.searchParams.get('to');
  // Sem 'from' = backfill total (data bem antiga). 'to' default = agora.
  const from = fromParam ? new Date(fromParam) : new Date('2000-01-01T00:00:00Z');
  const to = toParam ? new Date(toParam) : new Date();
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: 'invalid_range' }, { status: 400 });
  }

  // União das 4 fontes (cada linha conta 1 na sua métrica) agregada por
  // usuário×dia. Dia no fuso local (America/Sao_Paulo); SUM(...)::int evita BigInt.
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT nexus_user_id,
           to_char(day, 'YYYY-MM-DD') AS day,
           SUM(studies)::int  AS studies,
           SUM(tickets)::int  AS tickets,
           SUM(messages)::int AS messages,
           SUM(comments)::int AS comments
    FROM (
      SELECT u.nexus_user_id AS nexus_user_id,
             (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day,
             1 AS studies, 0 AS tickets, 0 AS messages, 0 AS comments
      FROM studies s JOIN app_users u ON u.id = s.author_id
      WHERE s.created_at >= ${from} AND s.created_at <= ${to}
      UNION ALL
      SELECT u.nexus_user_id, (t.created_at AT TIME ZONE 'America/Sao_Paulo')::date,
             0, 1, 0, 0
      FROM tickets t JOIN app_users u ON u.id = t.requester_id
      WHERE t.created_at >= ${from} AND t.created_at <= ${to}
      UNION ALL
      SELECT u.nexus_user_id, (m.created_at AT TIME ZONE 'America/Sao_Paulo')::date,
             0, 0, 1, 0
      FROM ticket_messages m JOIN app_users u ON u.id = m.author_id
      WHERE m.created_at >= ${from} AND m.created_at <= ${to}
      UNION ALL
      SELECT u.nexus_user_id, (c.created_at AT TIME ZONE 'America/Sao_Paulo')::date,
             0, 0, 0, 1
      FROM comments c JOIN app_users u ON u.id = c.author_id
      WHERE c.created_at >= ${from} AND c.created_at <= ${to}
    ) x
    GROUP BY nexus_user_id, day
    ORDER BY day
  `;

  const days = rows.map((r) => ({
    userId: r.nexus_user_id,
    day: r.day,
    studies: Number(r.studies) || 0,
    tickets: Number(r.tickets) || 0,
    messages: Number(r.messages) || 0,
    comments: Number(r.comments) || 0,
  }));

  return NextResponse.json({ from: from.toISOString(), to: to.toISOString(), days });
}
