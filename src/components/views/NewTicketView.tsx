'use client';
// Abrir um chamado (formulário). Extraído de AppClient (Fase 2).
import { IconArrowLeft, IconTicket, IconSearch, IconX } from '../icons';
import { Field, inputStyle, labelStyle, miniBtn, ticketNumChip } from '../ui/formKit';
import { timeAgo } from '@/lib/present';
import { useApp } from '../AppProvider';

export function NewTicketView() {
  const { goTickets, newTicket, setNewTicket, firstCat, catNames, refSelected, refQuery, searchRefTickets, refSearching, refResults, selectRefTicket, submitTicket } = useApp();
  return (
    <div style={{ paddingTop: 28, animation: 'cpFade .35s ease' }}>
      <button onClick={goTickets} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 22 }}><IconArrowLeft size={15} sw={2.4} /> Cancelar</button>
      <h1 className="font-grotesk" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Abrir um chamado</h1>
      <p style={{ margin: '0 0 24px', color: 'var(--fg2)', fontSize: 15 }}>Descreva sua dúvida e a equipe de consultoria responderá por aqui.</p>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 1px 3px var(--shadow)', padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Assunto"><input value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} placeholder="Resuma sua dúvida em uma frase" style={inputStyle(true)} /></Field>
        <Field label="Categoria"><select value={newTicket.category || firstCat} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })} style={{ ...inputStyle(), cursor: 'pointer' }}>{catNames.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        <Field label="Descrição"><textarea value={newTicket.body} onChange={(e) => setNewTicket({ ...newTicket, body: e.target.value })} rows={6} placeholder="Detalhe o contexto, prazos e o que você precisa saber…" style={{ ...inputStyle(), lineHeight: 1.65 }} /></Field>

        {/* Citar um chamado anterior — pesquise por número ou palavra-chave */}
        <div>
          <label style={labelStyle}>Citar chamado anterior <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>(opcional — dá contexto ao consultor)</span></label>
          <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginBottom: 10, lineHeight: 1.5 }}>Se for sobre o <b>mesmo assunto</b> de um chamado anterior, procure manter o <b>mesmo padrão no título</b> — isso facilita a apresentação e as buscas futuras.</div>
          {refSelected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent-soft)' }}>
              <IconTicket size={18} stroke="var(--accent)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{refSelected.number} · {refSelected.subject}</div>
                <div style={{ fontSize: 12, color: 'var(--fg3)' }}>{refSelected.author.name} · {timeAgo(refSelected.createdAt)}</div>
              </div>
              <button onClick={() => selectRefTicket(null)} title="Remover citação" style={miniBtn}><IconX size={13} sw={2.4} /></button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 22, transform: 'translateY(-50%)', pointerEvents: 'none' }}><IconSearch size={17} stroke="var(--fg3)" /></span>
              <input value={refQuery} onChange={(e) => searchRefTickets(e.target.value)} placeholder="Pesquise pelo número (#12) ou palavra-chave…" style={{ ...inputStyle(), padding: '12px 14px 12px 40px' }} />
              {(refSearching || refResults.length > 0 || (!!refQuery.trim())) && (
                <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', overflow: 'hidden', boxShadow: '0 8px 24px var(--shadow)' }}>
                  {refSearching && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--fg3)' }}>Buscando…</div>}
                  {!refSearching && refResults.map((t) => (
                    <button key={t.id} onClick={() => selectRefTicket(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', cursor: 'pointer' }}>
                      <span style={ticketNumChip}>#{t.number}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--fg3)' }}>{t.author.name} · {timeAgo(t.createdAt)}</span>
                      </span>
                    </button>
                  ))}
                  {!refSearching && refQuery.trim() && refResults.length === 0 && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--fg3)' }}>Nenhum chamado encontrado.</div>}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          <button onClick={goTickets} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={submitTicket} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 18px var(--accent-soft)' }}>Enviar chamado</button>
        </div>
      </div>
    </div>
  );
}
