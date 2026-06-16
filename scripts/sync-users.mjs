// Sync standalone (sem sessão): puxa /users do Nexus e faz upsert por nexus_user_id.
// Uso: node scripts/sync-users.mjs   (lê DATABASE_URL, NEXUS_BASE_URL, NEXUS_API_KEY do ambiente)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = process.env.NEXUS_BASE_URL;
const KEY = process.env.NEXUS_API_KEY;
const DUAL = (process.env.DUAL_VIEW_DEPARTMENTS || 'Diretoria').split(',').map((s) => s.trim().toLowerCase());
const CONSULTOR = (process.env.CONSULTOR_DEPARTMENTS || 'Consultoria').split(',').map((s) => s.trim().toLowerCase());
const ADMIN_CARGOS = (process.env.ADMIN_CARGOS || 'Administrador').split(',').map((s) => s.trim().toLowerCase());

function deriveBaseRole(dep, cargo) {
  const d = (dep || '').trim().toLowerCase();
  const c = (cargo || '').trim().toLowerCase();
  if (c && ADMIN_CARGOS.includes(c)) return 'both';
  if (DUAL.includes(d)) return 'both';
  if (CONSULTOR.includes(d)) return 'consultor';
  return 'cliente';
}

async function main() {
  if (!BASE || !KEY) throw new Error('NEXUS_BASE_URL/NEXUS_API_KEY ausentes');
  const res = await fetch(`${BASE}/api/integrations/users?includeInactive=true`, { headers: { 'X-API-Key': KEY } });
  if (!res.ok) throw new Error(`Nexus /users ${res.status}`);
  const users = await res.json();

  const seen = new Set();
  let created = 0, updated = 0;
  for (const u of users) {
    seen.add(u.employeeId);
    const data = {
      username: u.username ?? null, name: u.name, email: u.email ?? null, phone: u.phone ?? null,
      cargo: u.role ?? null, department: u.department ?? null, nexusDeptId: u.departmentId ?? null,
      avatar: u.avatar ?? null, status: u.status ?? 'active',
      hireDate: u.hireDate ? new Date(u.hireDate) : null, baseRole: deriveBaseRole(u.department, u.role),
    };
    const ex = await prisma.appUser.findUnique({ where: { nexusUserId: u.employeeId }, select: { id: true } });
    if (ex) { await prisma.appUser.update({ where: { nexusUserId: u.employeeId }, data }); updated++; }
    else { await prisma.appUser.create({ data: { nexusUserId: u.employeeId, ...data } }); created++; }
  }
  // desativa quem sumiu
  const locals = await prisma.appUser.findMany({ where: { status: { not: 'inactive' } }, select: { id: true, nexusUserId: true } });
  let deactivated = 0;
  for (const l of locals) if (!seen.has(l.nexusUserId)) { await prisma.appUser.update({ where: { id: l.id }, data: { status: 'inactive' } }); deactivated++; }

  console.log(JSON.stringify({ total: users.length, created, updated, deactivated }));
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); process.exit(1); });
