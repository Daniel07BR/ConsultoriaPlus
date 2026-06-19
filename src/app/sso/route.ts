// Entrada de SSO vinda do Nexus: GET /sso?nexus_ticket=<t>
// Contrato: docs/INTEGRACAO-SISTEMAS.md §3.2. Redirects sempre a partir de APP_URL.
import { NextRequest, NextResponse } from 'next/server';
import { resolveTicket } from '@/lib/nexus';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/session';
import { deriveBaseRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

function base(): string {
  return process.env.APP_URL || 'http://localhost:3000';
}

export async function GET(req: NextRequest) {
  const ticket = req.nextUrl.searchParams.get('nexus_ticket');

  // Sem ticket → login local (NUNCA redireciona de volta ao Nexus → loop).
  if (!ticket) {
    return NextResponse.redirect(new URL('/login', base()));
  }

  let result;
  try {
    result = await resolveTicket(ticket);
  } catch {
    return NextResponse.redirect(new URL('/login?reason=erro', base()));
  }

  if (!result.authenticated) {
    return NextResponse.redirect(new URL('/login?reason=expirado', base()));
  }
  if (!result.authorized || !result.user) {
    return NextResponse.redirect(new URL('/sem-acesso', base()));
  }

  const u = result.user;
  // Upsert por user.id (UUID Nexus), nunca por e-mail.
  const data = {
    name: u.name,
    email: u.email ?? null,
    username: u.username ?? null,
    cargo: u.role ?? null,
    department: u.department ?? null,
    nexusDeptId: u.departmentId ?? null,
    avatar: u.avatar ?? null,
    passwordHash: u.passwordHash ?? undefined, // espelha o hash do Nexus (login local offline)
    status: 'active',
    baseRole: deriveBaseRole(u.department, u.role),
  };
  const appUser = await prisma.appUser.upsert({
    where: { nexusUserId: u.id },
    create: { nexusUserId: u.id, ...data },
    update: data,
  });

  await createSession({ uid: appUser.id, nexusUserId: appUser.nexusUserId, name: appUser.name });
  return NextResponse.redirect(new URL('/', base()));
}
