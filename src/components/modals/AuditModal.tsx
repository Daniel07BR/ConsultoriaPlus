'use client';
// Modal de trilha de auditoria do chamado (edições/exclusões). Extraído (Fase 2).
import { IconRefresh, IconX } from '../icons';
import { timeAgo } from '@/lib/present';
import { useApp } from '../AppProvider';

export function AuditModal() {
  const { auditModal, setAuditModal } = useApp();
  if (!auditModal) return null;
  return (
    <div onClick={() => setAuditModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20, 8, 14, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'cpFade .2s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 620, maxHeight: '85vh', overflow: 'hidden', background: 'var(--surface)', color: 'var(--fg)', borderRadius: 22, border: '2px solid var(--accent)', boxShadow: '0 24px 60px rgba(255, 92, 137, 0.28), 0 30px 80px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', animation: 'cpPop .28s cubic-bezier(.2,.9,.3,1.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><IconRefresh size={21} sw={2.2} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-grotesk" style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Auditoria do chamado #{auditModal.number}</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg3)' }}>Edições, exclusões e alterações do chamado · visível só para a consultoria</div>
          </div>
          <button onClick={() => setAuditModal(null)} title="Fechar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', cursor: 'pointer' }}><IconX size={17} /></button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!auditModal.items && <div style={{ color: 'var(--fg3)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Carregando…</div>}
          {auditModal.items && auditModal.items.length === 0 && <div style={{ color: 'var(--fg3)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Nenhuma alteração registrada neste chamado.</div>}
          {auditModal.items?.map((it) => {
            const isDel = it.action === 'delete';
            const isAssign = it.action === 'assign' || it.action === 'unassign';
            const badge = isDel ? 'EXCLUSÃO' : it.action === 'title' ? 'TÍTULO' : it.action === 'reference' ? 'CITAÇÃO' : it.action === 'assign' ? 'ASSUMIU' : it.action === 'unassign' ? 'LIBEROU' : 'EDIÇÃO';
            const scope = it.action === 'title' ? 'Título do chamado' : it.action === 'reference' ? 'Chamado citado' : isAssign ? 'Responsável pelo atendimento' : null;
            return (
              <div key={it.id} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', background: 'var(--surface2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em', background: isDel ? 'rgba(224,69,122,0.14)' : 'var(--accent-soft)', color: isDel ? '#e0457a' : 'var(--accent)' }}>{badge}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{it.editorName}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--fg3)' }}>({it.editorRole === 'consultor' ? 'consultor' : 'cliente'})</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11.5, color: 'var(--fg3)' }}>{timeAgo(it.createdAt)}</span>
                </div>
                {scope && <div style={{ fontSize: 12, color: 'var(--fg3)', marginBottom: 8 }}>{scope}</div>}
                {it.messageAuthor && <div style={{ fontSize: 12, color: 'var(--fg3)', marginBottom: 8 }}>Mensagem de {it.messageAuthor}</div>}
                {isDel ? (
                  <>
                    {it.reason && <div style={{ fontSize: 12.5, color: 'var(--fg2)', marginBottom: 8 }}><b>Motivo:</b> {it.reason}</div>}
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--fg3)', marginBottom: 4 }}>Conteúdo excluído</div>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg2)', whiteSpace: 'pre-wrap' }}>{it.previousText}</p>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#e0457a', marginBottom: 4 }}>Antes</div>
                      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg2)', whiteSpace: 'pre-wrap', textDecoration: 'line-through', opacity: 0.75 }}>{it.previousText}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#2f8a62', marginBottom: 4 }}>Depois</div>
                      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg)', whiteSpace: 'pre-wrap' }}>{it.newText}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
