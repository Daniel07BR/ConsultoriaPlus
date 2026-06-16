// Sessão local: JWT assinado (jose) em cookie httpOnly. Identidade amarrada ao
// nexus_user_id (UUID Nexus). Modelo do CIDE (docs/INTEGRACAO-SISTEMAS.md §3.6).
import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE = 'cp_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET ausente');
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  /** PK local do AppUser */
  uid: string;
  /** UUID Nexus (employeeId) */
  nexusUserId: string;
  name: string;
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: (process.env.APP_URL || '').startsWith('https'),
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
