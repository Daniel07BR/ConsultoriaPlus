// Pequenos helpers de form e chips (estilos + <Field>) extraídos de AppClient
// na Fase 0 do refactor. Sem lógica nem estado — só apresentação.
import type { CSSProperties, ReactNode } from 'react';

export const chipBase: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 15px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s ease' };

export const labelStyle: CSSProperties = { display: 'block', fontWeight: 700, fontSize: 13, color: 'var(--fg2)', marginBottom: 8 };
export function inputStyle(grotesk = false): CSSProperties {
  return { width: '100%', padding: '13px 15px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg)', fontSize: grotesk ? 15 : 14.5, fontFamily: grotesk ? "'Space Grotesk',sans-serif" : undefined, fontWeight: grotesk ? 600 : undefined, outline: 'none' };
}
export const attachPill: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 10px 8px 13px', borderRadius: 11, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700 };
export const miniBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' };
export const dateInput: CSSProperties = { padding: '8px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 13, outline: 'none', colorScheme: 'light' as CSSProperties['colorScheme'] };
export const pillX: CSSProperties = { display: 'inline-flex', border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', padding: 0, marginLeft: 2 };
export const ticketNumChip: CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '.01em', flexShrink: 0 };
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (<div><label style={labelStyle}>{label}</label>{children}</div>);
}
