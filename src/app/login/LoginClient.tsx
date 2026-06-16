'use client';
import { useEffect, useState } from 'react';
import { getJSON, postJSON } from '@/lib/client';
import { IconCheck } from '@/components/icons';

interface DevUser {
  id: string;
  name: string;
  department: string | null;
  baseRole: string;
  avatar: string | null;
}

const FEATURES = ['Estudos sempre atualizados', 'Chamados respondidos por especialistas', 'Tudo em um só lugar'];

export default function LoginClient({ portalUrl, devLogin }: { portalUrl: string; devLogin: boolean }) {
  const [users, setUsers] = useState<DevUser[]>([]);
  const [sel, setSel] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (devLogin) getJSON<{ users: DevUser[] }>('/api/dev-login').then((d) => setUsers(d.users)).catch(() => {});
  }, [devLogin]);

  async function doDevLogin() {
    if (!sel) return;
    setBusy(true);
    try {
      await postJSON('/api/dev-login', { userId: sel });
      window.location.href = '/';
    } catch {
      setBusy(false);
    }
  }

  const roleLabel = (r: string) => (r === 'both' ? 'Diretoria' : r === 'consultor' ? 'Consultor' : 'Cliente');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      {/* Hero */}
      <div style={{ flex: 1, background: 'linear-gradient(150deg, #ff5c89 0%, #fb7da2 55%, #fda8bf 100%)', color: '#fff', padding: '56px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 33, lineHeight: 1 }}>+</div>
          <div className="font-grotesk" style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>Consultoria Plus</div>
        </div>
        <div>
          <h1 className="font-grotesk" style={{ fontWeight: 700, fontSize: 42, lineHeight: 1.12, letterSpacing: '-0.03em', margin: '0 0 18px', maxWidth: '13ch' }}>A consultoria contábil, em rede.</h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, opacity: 0.93, maxWidth: '44ch', margin: '0 0 30px' }}>Estudos tributários, fiscais e contábeis num feed social. Tire dúvidas, abra chamados e acompanhe as respostas dos consultores.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, fontSize: 15 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconCheck size={14} stroke="#fff" sw={3} /></span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 13, opacity: 0.82 }}>© 2026 Consultoria Plus · Contabilidade Itamarathy</div>
      </div>

      {/* Painel de acesso */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, minWidth: 0, background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 className="font-grotesk" style={{ fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--fg)' }}>Bem-vindo</h2>
          <p style={{ margin: '0 0 28px', color: 'var(--fg2)', fontSize: 15 }}>Acesse com sua conta do Nexus para continuar.</p>

          <a href={portalUrl} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 14, borderRadius: 13, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', textDecoration: 'none', boxShadow: '0 8px 22px var(--accent-soft)' }}>
            Entrar pelo Nexus
          </a>
          <p style={{ margin: '16px 0 0', textAlign: 'center', fontSize: 13, color: 'var(--fg3)' }}>
            O acesso é feito pelo portal do Nexus. Sem cadastro ou senha próprios.
          </p>

          {devLogin && (
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>Login de desenvolvimento</div>
              <select value={sel} onChange={(e) => setSel(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg)', fontSize: 14, marginBottom: 12, cursor: 'pointer' }}>
                <option value="">Escolha um usuário…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — {roleLabel(u.baseRole)}{u.department ? ` (${u.department})` : ''}</option>
                ))}
              </select>
              <button onClick={doDevLogin} disabled={!sel || busy} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 14, cursor: sel ? 'pointer' : 'not-allowed', opacity: sel ? 1 : 0.6 }}>
                {busy ? 'Entrando…' : 'Entrar como este usuário'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
