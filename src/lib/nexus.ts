// Cliente server-to-server do Nexus. A X-API-Key NUNCA vai ao browser.
// Contrato: docs/INTEGRACAO-SISTEMAS.md (no repo Nexus).
import 'server-only';

const BASE = process.env.NEXUS_BASE_URL!;
const API_KEY = process.env.NEXUS_API_KEY!;

function headers() {
  return { 'Content-Type': 'application/json', 'X-API-Key': API_KEY };
}

// ---- SSO ---------------------------------------------------------------

export interface SsoUser {
  id: string; // UUID Nexus (employeeId)
  name: string;
  email?: string;
  username?: string;
  role?: string; // cargo
  department?: string;
  departmentId?: string;
  avatar?: string | null;
}

export type SsoResolve =
  | { authenticated: false }
  | { authenticated: true; authorized: false; user?: SsoUser }
  | { authenticated: true; authorized: true; user: SsoUser };

/** Troca o ticket de uso único pela identidade + autorização neste sistema. */
export async function resolveTicket(ticket: string): Promise<SsoResolve> {
  const res = await fetch(`${BASE}/api/integrations/sso/resolve`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ticket }),
    cache: 'no-store',
  });
  if (!res.ok) return { authenticated: false };
  return (await res.json()) as SsoResolve;
}

// ---- Diretório ---------------------------------------------------------

export interface NexusUser {
  employeeId: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  departmentId: string | null;
  status: string;
  hireDate: string | null;
  avatar: string | null;
}

/** Apenas funcionários COM liberação para este sistema, com foto. */
export async function fetchNexusUsers(includeInactive = true): Promise<NexusUser[]> {
  const url = new URL(`${BASE}/api/integrations/users`);
  if (includeInactive) url.searchParams.set('includeInactive', 'true');
  const res = await fetch(url, { headers: headers(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Nexus /users ${res.status}`);
  return (await res.json()) as NexusUser[];
}

export interface NexusDepartment {
  id: string;
  name: string;
}

export async function fetchNexusDepartments(): Promise<NexusDepartment[]> {
  const res = await fetch(`${BASE}/api/integrations/departments`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Nexus /departments ${res.status}`);
  return (await res.json()) as NexusDepartment[];
}

// ---- Comunicados (sino embutido) --------------------------------------

export interface FeedItem {
  id: string;
  title: string;
  content: string;
  type?: string;
  priority?: string;
  createdByName?: string;
  publishedAt?: string;
  expiresAt?: string | null;
  readAt?: string | null;
  sourceSystemName?: string | null;
  sourceCompanyName?: string | null;
  sourceCategory?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  imageUrl?: string | null;
}

export async function getAnnouncementsFeed(
  employeeId: string,
  unreadOnly = false,
): Promise<{ unreadCount: number; items: FeedItem[] }> {
  const url = new URL(`${BASE}/api/integrations/announcements/feed`);
  url.searchParams.set('employeeId', employeeId);
  if (unreadOnly) url.searchParams.set('unreadOnly', 'true');
  const res = await fetch(url, { headers: headers(), cache: 'no-store' });
  if (!res.ok) return { unreadCount: 0, items: [] };
  return (await res.json()) as { unreadCount: number; items: FeedItem[] };
}

export async function ackAnnouncement(employeeId: string, announcementId: string): Promise<void> {
  await fetch(`${BASE}/api/integrations/announcements/ack`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ employeeId, announcementId }),
    cache: 'no-store',
  });
}

export async function ackAllAnnouncements(employeeId: string): Promise<void> {
  await fetch(`${BASE}/api/integrations/announcements/ack-all`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ employeeId }),
    cache: 'no-store',
  });
}

// ---- Push de comunicados ----------------------------------------------

export interface PushAnnouncementInput {
  authorEmployeeId: string;
  title: string;
  content: string;
  type?: string;
  category?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  recipientEmployeeIds?: string[];
  sourceRef: string;
  // Quando true, o alerta (pessoal) aparece no sino de QUALQUER sistema onde o
  // destinatário estiver — não só no Consultoria Plus + Nexus.
  crossSystem?: boolean;
}

/**
 * Cria/atualiza um comunicado no Nexus (upsert por sourceRef neste sistema).
 * Server-to-server. Retorna { id, url? } ou null em falha (não derruba o fluxo).
 */
export async function pushAnnouncementToNexus(
  input: PushAnnouncementInput,
): Promise<{ id: string; url?: string } | null> {
  try {
    const res = await fetch(`${BASE}/api/integrations/announcements`, {
      method: 'PUT', // upsert (cria se não existe)
      headers: headers(),
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[nexus push] HTTP', res.status, await res.text().catch(() => ''));
      return null;
    }
    return (await res.json()) as { id: string; url?: string };
  } catch (err) {
    console.error('[nexus push] failed', err);
    return null;
  }
}
