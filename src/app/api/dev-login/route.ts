// Login de DESENVOLVIMENTO: lista usuários sincronizados e cria sessão sem passar
// pelo SSO do Nexus. Só funciona com DEV_LOGIN=true. Em produção fica desligado.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

function enabled() {
  return process.env.DEV_LOGIN === 'true';
}

export async function GET() {
  if (!enabled()) return NextResponse.json({ error: 'desativado' }, { status: 404 });
  const users = await prisma.appUser.findMany({
    where: { status: { not: 'inactive' } },
    orderBy: [{ baseRole: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, department: true, baseRole: true, avatar: true },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  if (!enabled()) return NextResponse.json({ error: 'desativado' }, { status: 404 });
  const b = await req.json().catch(() => null);
  const id = b?.userId;
  if (!id) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
  const user = await prisma.appUser.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'usuário não encontrado' }, { status: 404 });
  await createSession({ uid: user.id, nexusUserId: user.nexusUserId, name: user.name });
  return NextResponse.json({ ok: true });
}
