// Guard: sem sessão e sem nexus_ticket → login local (nunca o Nexus → loop).
// Allowlist: /sso, /login, /sem-acesso, assets, e o dev-login.
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

const PUBLIC = ['/sso', '/login', '/sem-acesso', '/api/dev-login'];

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Rotas de API se autoautorizam (requireUser → 401 JSON). Não redirecionar.
  if (pathname.startsWith('/api/')) return NextResponse.next();

  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;
  if (hasSession) return NextResponse.next();

  // Sem sessão: se veio com ticket, deixa o /sso tratar; senão, login local.
  if (searchParams.get('nexus_ticket')) {
    const url = req.nextUrl.clone();
    url.pathname = '/sso';
    return NextResponse.redirect(url);
  }

  const login = req.nextUrl.clone();
  login.pathname = '/login';
  login.search = '';
  return NextResponse.redirect(login);
}

export const config = {
  // Tudo exceto assets internos do Next e arquivos estáticos.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
