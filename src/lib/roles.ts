// Derivação de papel a partir do departamento/cargo Nexus, com override manual.
//
// Regras (Consultoria Plus):
//  - cargo em ADMIN_CARGOS (Administrador) → 'both' (admin do sistema)
//  - depto em DUAL_VIEW_DEPARTMENTS (Diretoria) → 'both' (alterna cliente/consultor)
//  - depto em CONSULTOR_DEPARTMENTS (Consultoria) → 'consultor'
//  - demais → 'cliente'
// O roleOverride, quando presente, vence a derivação.

export type AppRole = 'cliente' | 'consultor' | 'both';
export type ActingRole = 'cliente' | 'consultor';

function parseList(env: string | undefined): string[] {
  return (env ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const CONSULTOR = parseList(process.env.CONSULTOR_DEPARTMENTS || 'Consultoria');
const DUAL = parseList(process.env.DUAL_VIEW_DEPARTMENTS || 'Diretoria');
const ADMIN_CARGOS = parseList(process.env.ADMIN_CARGOS || 'Administrador');
// Cargos de liderança que ganham acesso ao Feed de Gestão (além de consultor/diretoria/admin).
const GESTAO_CARGOS = parseList(process.env.GESTAO_CARGOS || 'Gestor,Sub-encarregado');

export function deriveBaseRole(
  department: string | null | undefined,
  cargo?: string | null,
): AppRole {
  const d = (department ?? '').trim().toLowerCase();
  const c = (cargo ?? '').trim().toLowerCase();
  if (c && ADMIN_CARGOS.includes(c)) return 'both';
  if (d && DUAL.includes(d)) return 'both';
  if (d && CONSULTOR.includes(d)) return 'consultor';
  return 'cliente';
}

/** Papel efetivo (considera override manual). */
export function effectiveRole(baseRole: string, roleOverride?: string | null): AppRole {
  const r = (roleOverride || baseRole) as AppRole;
  return r === 'consultor' || r === 'both' ? r : 'cliente';
}

/** Pode atuar como consultor (publicar estudos, responder chamados)? */
export function canActAsConsultor(role: AppRole): boolean {
  return role === 'consultor' || role === 'both';
}

/**
 * Admin do sistema (cargo em ADMIN_CARGOS, ex.: Administrador — TI). Distinto da
 * Diretoria: ambos são papel 'both', mas só o admin tem poderes destrutivos como
 * excluir qualquer chamado. NÃO derive isso de 'both' (Diretoria também é 'both').
 */
export function isSystemAdmin(cargo?: string | null): boolean {
  const c = (cargo ?? '').trim().toLowerCase();
  return !!c && ADMIN_CARGOS.includes(c);
}

/**
 * Acesso ao Feed de Gestão: consultoria/diretoria/admin (papel consultor|both)
 * OU cargo de liderança (Gestor, Sub-encarregado). Os demais não veem o feed.
 */
export function canAccessGestao(role: AppRole, cargo?: string | null): boolean {
  if (role === 'consultor' || role === 'both') return true;
  const c = (cargo ?? '').trim().toLowerCase();
  return !!c && GESTAO_CARGOS.includes(c);
}

/**
 * Acesso ao Feed de Gestão restrito ao PRÓPRIO departamento? (Gestor/Sub-encarregado
 * que entram só via cargo). Estes são os únicos afetados pela segmentação por
 * departamento de uma publicação. Consultoria/Diretoria/Admin (papel consultor|both)
 * NÃO são restritos — veem tudo, independentemente dos departamentos ocultos.
 */
export function isDeptScopedGestao(role: AppRole, cargo?: string | null): boolean {
  if (role === 'consultor' || role === 'both') return false;
  const c = (cargo ?? '').trim().toLowerCase();
  return !!c && GESTAO_CARGOS.includes(c);
}

/**
 * Pode ver uma publicação de gestão, considerando os departamentos ocultos dela.
 * Regra: precisa de acesso ao feed; se a publicação oculta o SEU departamento e você
 * é Gestor/Sub (restrito por depto), não vê. Autor sempre vê o próprio post — trate
 * isso na camada de rota (esta função não conhece o autor).
 */
export function canSeeGestaoStudy(
  role: AppRole,
  cargo: string | null | undefined,
  department: string | null | undefined,
  excludedDepartments: string[] | null | undefined,
): boolean {
  if (!canAccessGestao(role, cargo)) return false;
  const excluded = (excludedDepartments ?? []).map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (excluded.length === 0) return true;
  if (!isDeptScopedGestao(role, cargo)) return true; // consultoria/diretoria/admin veem tudo
  const d = (department ?? '').trim().toLowerCase();
  return !excluded.includes(d);
}

/** Pode alternar entre as duas visões? */
export function canSwitchView(role: AppRole): boolean {
  return role === 'both';
}

/** Visão padrão ao entrar. */
export function defaultView(role: AppRole): ActingRole {
  return role === 'cliente' ? 'cliente' : 'consultor';
}
