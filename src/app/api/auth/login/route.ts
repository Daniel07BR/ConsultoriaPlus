// Login por senha (senha única do Nexus). A senha é propriedade do Nexus; aqui
// validamos o hash bcrypt espelhado (passwordHash) localmente — offline-safe.
// NÃO existe troca de senha aqui (só no Nexus). Modelo: docs/INTEGRACAO-SISTEMAS.md.
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Rate-limit simples por IP em memória (best-effort; reset a cada restart).
const ATTEMPTS = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cur = ATTEMPTS.get(ip);
  if (!cur || now - cur.ts > WINDOW_MS) {
    ATTEMPTS.set(ip, { count: 1, ts: now });
    return false;
  }
  cur.count++;
  return cur.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  // Acha por username (case-insensitive) OU email completo (case-insensitive)
  // OU prefixo do email (parte antes do @, case-insensitive) — ex.: "joice.rocha"
  // casa "joice.rocha@dominio". Atende usuario com username em underscore mas
  // email com ponto: padrao e logar com a parte antes do @.
  const user = await prisma.appUser.findFirst({
    where: {
      OR: [
        { username: { equals: username, mode: "insensitive" } },
        { email: { equals: username, mode: "insensitive" } },
        { email: { startsWith: username + "@", mode: "insensitive" } },
      ],
    },
  });

  if (!user || user.status !== "active" || !user.passwordHash) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await createSession({ uid: user.id, nexusUserId: user.nexusUserId, name: user.name });
  return NextResponse.json({ ok: true });
}
