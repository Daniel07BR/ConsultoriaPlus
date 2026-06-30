// Resolução do usuário logado a partir da sessão local.
import 'server-only';
import { prisma } from './db';
import { readSession } from './session';
import { effectiveRole, canActAsConsultor, canSwitchView, canAccessGestao, defaultView, type AppRole, type ActingRole } from './roles';
import type { AppUser } from '@prisma/client';

export interface CurrentUser {
  user: AppUser;
  role: AppRole; // papel efetivo
  canConsultor: boolean; // pode responder/publicar
  canSwitch: boolean; // pode alternar visão (Diretoria)
  canGestao: boolean; // tem acesso ao Feed de Gestão
  defaultView: ActingRole;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const sess = await readSession();
  if (!sess) return null;
  const user = await prisma.appUser.findUnique({ where: { id: sess.uid } });
  if (!user || user.status === 'inactive') return null;

  const role = effectiveRole(user.baseRole, user.roleOverride);
  return {
    user,
    role,
    canConsultor: canActAsConsultor(role),
    canSwitch: canSwitchView(role),
    canGestao: canAccessGestao(role, user.cargo),
    defaultView: defaultView(role),
  };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
