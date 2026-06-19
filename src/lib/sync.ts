// Sincronização de diretório (o botão "Sincronizar com Nexus").
// Upsert por nexus_user_id; nunca por e-mail. Desativa quem sumir/ficar inativo.
import 'server-only';
import { prisma } from './db';
import { fetchNexusUsers } from './nexus';
import { deriveBaseRole } from './roles';

export interface SyncResult {
  total: number;
  created: number;
  updated: number;
  deactivated: number;
}

export async function syncUsersFromNexus(): Promise<SyncResult> {
  const users = await fetchNexusUsers(true);
  const seen = new Set<string>();
  let created = 0;
  let updated = 0;

  for (const u of users) {
    seen.add(u.employeeId);
    const data = {
      username: u.username ?? null,
      name: u.name,
      email: u.email,
      phone: u.phone,
      cargo: u.role,
      department: u.department,
      nexusDeptId: u.departmentId,
      avatar: u.avatar,
      status: u.status,
      hireDate: u.hireDate ? new Date(u.hireDate) : null,
      baseRole: deriveBaseRole(u.department, u.role),
    };

    const existing = await prisma.appUser.findUnique({
      where: { nexusUserId: u.employeeId },
      select: { id: true },
    });

    if (existing) {
      await prisma.appUser.update({
        where: { nexusUserId: u.employeeId },
        data: { ...data, passwordHash: u.passwordHash ?? undefined },
      });
      updated++;
    } else {
      await prisma.appUser.create({
        data: { nexusUserId: u.employeeId, ...data, passwordHash: u.passwordHash ?? null },
      });
      created++;
    }
  }

  // Desativa quem está local mas sumiu da resposta (perdeu liberação). Nunca deleta.
  const localActive = await prisma.appUser.findMany({
    where: { status: { not: 'inactive' } },
    select: { id: true, nexusUserId: true },
  });
  let deactivated = 0;
  for (const local of localActive) {
    if (!seen.has(local.nexusUserId)) {
      await prisma.appUser.update({ where: { id: local.id }, data: { status: 'inactive' } });
      deactivated++;
    }
  }

  return { total: users.length, created, updated, deactivated };
}
