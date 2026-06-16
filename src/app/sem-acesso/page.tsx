export const dynamic = 'force-dynamic';

export default function SemAcesso() {
  const portal = process.env.NEXUS_PORTAL_URL || '#';
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 440, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 40, boxShadow: '0 1px 3px var(--shadow)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, margin: '0 auto 20px' }}>+</div>
        <h1 className="font-grotesk" style={{ fontSize: 24, fontWeight: 700, margin: '0 0 10px', color: 'var(--fg)' }}>Sem acesso ao Consultoria Plus</h1>
        <p style={{ color: 'var(--fg2)', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
          Sua conta do Nexus ainda não tem liberação para este sistema. Fale com a equipe de
          consultoria ou com a T.I. para solicitar o acesso.
        </p>
        <a href={portal} style={{ display: 'inline-block', padding: '12px 22px', borderRadius: 12, background: 'var(--accent)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontFamily: "'Space Grotesk',sans-serif" }}>
          Voltar ao Nexus
        </a>
      </div>
    </div>
  );
}
