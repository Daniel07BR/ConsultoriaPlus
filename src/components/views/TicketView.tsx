'use client';
// Conversa de um chamado (mensagens, edição de título/citação, fechar+avaliar).
// Extraído de AppClient (Fase 2).
import Avatar from '../Avatar';
import { Hearts } from '../ui/Hearts';
import {
  IconArrowLeft, IconRefresh, IconEdit, IconTicket, IconSearch, IconCheck, IconLink,
  IconArrowRight, IconX, IconCheckDouble, IconSend, IconHeart, IconUsers,
} from '../icons';
import { labelStyle, inputStyle, miniBtn, ticketNumChip } from '../ui/formKit';
import { statusMeta, timeAgo, RATING_LABELS, consultorColor } from '@/lib/present';
import { useApp } from '../AppProvider';
import { Linkify } from './Linkify';

const notifBadge: React.CSSProperties = { background: 'var(--accent)', color: '#fff', minWidth: 19, height: 19, padding: '0 5px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };

export function TicketView() {
  const {
    activeTicket, goTickets, me, openAudit, colorOf, editingTicket, setEditingTicket, startEditTicket,
    editRef, setEditRef, refQuery, searchRefTickets, refSearching, refResults, pickEditRef, cancelEditTicket, saveTicketEdit,
    openTicket, editingMessage, setEditingMessage, deleteMessage, saveMessage, setReadsModal,
    closing, setClosing, ratingHover, setRatingHover, closeTicket, ticketDraft, setTicketDraft, sendTicketReply, isConsultor, ticketInputRef, assumirTicket,
  } = useApp();
  const t = activeTicket;
  if (!t) return <div style={{ paddingTop: 60, textAlign: 'center', color: 'var(--fg3)' }}>Carregando chamado…</div>;
  const sm = statusMeta(t.status);
  const assigneeColor = t.assignee ? consultorColor(t.assignee.name) : null;
  return (
    <div style={{ paddingTop: 28, animation: 'cpFade .35s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={goTickets} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><IconArrowLeft size={15} sw={2.4} /> Todos os chamados</button>
        <div style={{ flex: 1 }} />
        {me.canConsultor && t.auditCount > 0 && (
          <button onClick={openAudit} title="Ver edições e exclusões de mensagens deste chamado" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><IconRefresh size={15} sw={2.2} /> Auditoria <span style={{ ...notifBadge, background: 'var(--fg3)' }}>{t.auditCount}</span></button>
        )}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 1px 3px var(--shadow)', padding: '24px 26px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 13 }}>
          <span style={ticketNumChip} title={`Chamado nº ${t.number}`}>#{t.number}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 999, background: sm.tint, color: sm.text, fontSize: 11.5, fontWeight: 700 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: sm.dot }} />{sm.label}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--fg3)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: colorOf(t.category) }} />{t.category}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12.5, color: 'var(--fg3)' }}>Aberto {timeAgo(t.createdAt)}</span>
          {t.canEdit && !editingTicket && (
            <button onClick={startEditTicket} title="Editar título e citação" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}><IconEdit size={14} sw={2.2} /> Editar</button>
          )}
        </div>
        {editingTicket ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Título do chamado</label>
              <input value={editingTicket.subject} onChange={(e) => setEditingTicket({ subject: e.target.value })} style={inputStyle(true)} />
            </div>
            <div>
              <label style={labelStyle}>Chamado citado <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>(vincule ou desvincule um chamado de referência)</span></label>
              {editRef ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent-soft)' }}>
                  <IconTicket size={18} stroke="var(--accent)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{editRef.number} · {editRef.subject}</div>
                  </div>
                  <button onClick={() => setEditRef(null)} title="Desvincular" style={{ ...miniBtn, color: '#e0457a' }}>Desvincular</button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: 22, transform: 'translateY(-50%)', pointerEvents: 'none' }}><IconSearch size={17} stroke="var(--fg3)" /></span>
                  <input value={refQuery} onChange={(e) => searchRefTickets(e.target.value, t.id)} placeholder="Pesquise pelo número (#12) ou palavra-chave…" style={{ ...inputStyle(), padding: '12px 14px 12px 40px' }} />
                  {(refSearching || refResults.length > 0 || !!refQuery.trim()) && (
                    <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', overflow: 'hidden', boxShadow: '0 8px 24px var(--shadow)' }}>
                      {refSearching && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--fg3)' }}>Buscando…</div>}
                      {!refSearching && refResults.map((rt) => (
                        <button key={rt.id} onClick={() => pickEditRef(rt)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', cursor: 'pointer' }}>
                          <span style={ticketNumChip}>#{rt.number}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rt.subject}</span>
                            <span style={{ display: 'block', fontSize: 12, color: 'var(--fg3)' }}>{rt.author.name} · {timeAgo(rt.createdAt)}</span>
                          </span>
                        </button>
                      ))}
                      {!refSearching && refQuery.trim() && refResults.length === 0 && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--fg3)' }}>Nenhum chamado encontrado.</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={cancelEditTicket} style={{ padding: '10px 18px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveTicketEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 11, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}><IconCheck size={15} sw={2.4} /> Salvar</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="font-grotesk" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, margin: 0 }}>{t.subject}</h1>
            {t.reference && (
              <button
                onClick={() => openTicket(t.reference!.id)}
                title="Abrir o chamado citado para ver o contexto"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginTop: 14, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', cursor: 'pointer', textAlign: 'left', maxWidth: '100%' }}
              >
                <IconLink size={16} stroke="var(--accent)" />
                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg3)' }}>Refere-se ao chamado</span>
                  <span style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{t.reference.number} · {t.reference.subject}</span>
                </span>
                <IconArrowRight size={15} sw={2.4} style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </button>
            )}
          </>
        )}
      </div>
      {/* Responsável pelo atendimento ("Assumir o chamado") — aponta quem está atendendo,
          mesmo sem resposta. Consultor assume/libera; cliente vê só quem está atendendo. */}
      {t.status !== 'fechado' && (t.assignee || t.canAssign) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'var(--surface)', border: `1px solid ${assigneeColor ? assigneeColor + '55' : 'var(--border)'}`, borderRadius: 16, padding: '13px 18px', marginBottom: 18, boxShadow: assigneeColor ? `0 0 0 1px ${assigneeColor}33` : '0 1px 3px var(--shadow)' }}>
          {t.assignee ? (
            <>
              <Avatar name={t.assignee.name} avatar={t.assignee.avatar} size={36} role="consultor" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--fg3)' }}>Em atendimento</div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: assigneeColor ?? 'var(--fg)' }}>{t.assignee.name}{t.assignedToMe ? ' · você' : ''}</div>
              </div>
              {t.canAssign && (t.assignedToMe ? (
                <button onClick={() => assumirTicket(true)} title="Deixar de ser o responsável por este chamado" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><IconX size={14} sw={2.4} /> Liberar</button>
              ) : (
                <button onClick={() => assumirTicket(false)} title="Assumir este chamado para você" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 11, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}><IconCheck size={15} sw={2.4} /> Assumir para mim</button>
              ))}
            </>
          ) : (
            <>
              <span style={{ width: 36, height: 36, borderRadius: '50%', border: '2px dashed var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg3)', flexShrink: 0 }}><IconUsers size={17} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>Ninguém assumiu este chamado ainda</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg3)' }}>Assuma para sinalizar às demais consultoras que você está atendendo.</div>
              </div>
              <button onClick={() => assumirTicket(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}><IconCheck size={16} sw={2.4} /> Assumir o chamado</button>
            </>
          )}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
        {t.messages.map((m) => { const right = m.role === 'consultor'; const isC = m.role === 'consultor'; const del = m.deleted; const canDel = m.mine || (me.canConsultor && m.role === 'consultor'); return (
          <div key={m.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: right ? 'row-reverse' : 'row' }}>
            <Avatar name={m.author.name} avatar={m.author.avatar} size={38} role={isC ? 'consultor' : 'cliente'} />
            <div style={{ flex: 1, maxWidth: '82%', padding: '14px 16px', borderRadius: 16, background: del ? 'var(--surface2)' : (right ? 'var(--accent-soft)' : 'var(--surface)'), border: del ? '1px dashed var(--border)' : `1px solid ${right ? 'var(--accent-soft)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', color: del ? 'var(--fg3)' : undefined }}>{m.author.name}</span>
                {m.author.department && <span style={isC ? { background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 } : { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--fg3)', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{m.author.department}</span>}
                <span style={{ fontSize: 11.5, color: 'var(--fg3)' }}>· {timeAgo(m.createdAt)}{m.edited && !del ? ' · editado' : ''}</span>
                {!del && (m.mine || canDel) && editingMessage?.id !== m.id && (
                  <span style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                    {m.mine && <button onClick={() => setEditingMessage({ id: m.id, text: m.text })} style={miniBtn}>Editar</button>}
                    {canDel && <button onClick={() => deleteMessage(m.id)} title="Excluir" style={{ ...miniBtn, color: '#e0457a' }}><IconX size={13} sw={2.4} /></button>}
                  </span>
                )}
              </div>
              {editingMessage?.id === m.id ? (
                <div>
                  <textarea value={editingMessage.text} onChange={(e) => setEditingMessage({ id: m.id, text: e.target.value })} rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 14, outline: 'none' }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                    <button onClick={() => setEditingMessage(null)} style={miniBtn}>Cancelar</button>
                    <button onClick={saveMessage} style={{ ...miniBtn, background: 'var(--accent)', color: '#fff', border: 'none' }}>Salvar</button>
                  </div>
                </div>
              ) : del ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--fg3)', fontStyle: 'italic' }}>
                    <IconX size={14} sw={2.4} /> Mensagem excluída{m.deletedByName ? ` por ${m.deletedByName}` : ''}{m.deletedAt ? ` · ${timeAgo(m.deletedAt)}` : ''}
                  </div>
                  {m.deletedReason && <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginTop: 4 }}>Motivo: {m.deletedReason}</div>}
                  {me.canConsultor && m.text && (
                    <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, border: '1px dashed var(--border)', background: 'var(--surface)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 5 }}>Conteúdo original · visível só para a consultoria</div>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--fg2)', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}><Linkify text={m.text} /></p>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}><Linkify text={m.text} /></p>
              )}
              {/* Recibo de leitura ("enviada"/"visto") — visível em toda mensagem, p/ qualquer usuário */}
              {!del && editingMessage?.id !== m.id && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  {m.reads.length > 0 ? (
                    <button onClick={() => setReadsModal({ preview: m.text, items: m.reads })} title="Ver quem visualizou e quando" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 4px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                      <IconCheckDouble size={15} stroke="var(--accent)" sw={2.4} /> Visto{m.reads.length > 1 ? ` · ${m.reads.length}` : ` por ${m.reads[0].name.split(' ')[0]}`}
                    </button>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg3)' }}>
                      <IconCheck size={13} stroke="var(--fg3)" sw={2.4} /> Enviada
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ); })}
      </div>
      {/* Chamado fechado: mostra a avaliação */}
      {t.status === 'fechado' ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 22px', boxShadow: '0 1px 3px var(--shadow)', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--fg2)', marginBottom: 10 }}>Chamado fechado pelo cliente{t.closedAt ? ` · ${timeAgo(t.closedAt)}` : ''}</div>
          {t.rating ? (
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Hearts n={t.rating} size={26} />
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)', fontFamily: "'Space Grotesk',sans-serif" }}>{t.ratingLabel}</div>
            </div>
          ) : <div style={{ color: 'var(--fg3)', fontSize: 14 }}>Sem avaliação.</div>}
        </div>
      ) : (
        <>
          {/* Caixa de resposta (dono ou consultor) */}
          {t.canReply && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, boxShadow: '0 1px 3px var(--shadow)', marginBottom: t.canClose ? 14 : 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--fg2)', marginBottom: 10 }}>{isConsultor ? 'Responder ao cliente' : 'Adicionar resposta'}</div>
              <textarea ref={ticketInputRef} value={ticketDraft} onChange={(e) => setTicketDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTicketReply(); } }} rows={3} placeholder={isConsultor ? 'Escreva a resposta da consultoria… (Enter envia · Shift+Enter quebra linha)' : 'Escreva sua mensagem… (Enter envia · Shift+Enter quebra linha)'} style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg)', fontSize: 14.5, lineHeight: 1.55, outline: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 11 }}>
                <button onClick={sendTicketReply} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}><IconSend size={16} /> Enviar</button>
              </div>
            </div>
          )}

          {/* Fechar + avaliar (só o cliente que abriu) */}
          {t.canClose && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--accent-soft)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px var(--shadow)' }}>
              {!closing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>Já resolveu sua dúvida?</div>
                    <div style={{ fontSize: 13, color: 'var(--fg3)' }}>Feche o chamado e avalie o atendimento.</div>
                  </div>
                  <button onClick={() => { setClosing(true); setRatingHover(0); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}><IconCheck size={16} sw={2.4} /> Fechar e avaliar</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--fg)', marginBottom: 4, fontFamily: "'Space Grotesk',sans-serif" }}>Como foi o atendimento?</div>
                  <div style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 14 }}>Toque nos corações para avaliar.</div>
                  <div style={{ display: 'inline-flex', gap: 6, marginBottom: 8 }} onMouseLeave={() => setRatingHover(0)}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} onMouseEnter={() => setRatingHover(i)} onClick={() => closeTicket(i)} title={RATING_LABELS[i]} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}>
                        <IconHeart size={34} fill={i <= ratingHover ? 'var(--accent)' : 'none'} stroke={i <= ratingHover ? 'var(--accent)' : 'var(--fg3)'} />
                      </button>
                    ))}
                  </div>
                  <div style={{ height: 22, fontWeight: 700, fontSize: 15, color: 'var(--accent)', fontFamily: "'Space Grotesk',sans-serif" }}>{ratingHover ? RATING_LABELS[ratingHover] : ''}</div>
                  <button onClick={() => { setClosing(false); setRatingHover(0); }} style={{ ...miniBtn, marginTop: 8 }}>Cancelar</button>
                </div>
              )}
            </div>
          )}

          {/* Visualização sem permissão de resposta (histórico de outro usuário) */}
          {!t.canReply && !t.canClose && (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', color: 'var(--fg3)', fontSize: 13.5, textAlign: 'center' }}>
              Você está visualizando este chamado pelo histórico.
            </div>
          )}
        </>
      )}
    </div>
  );
}
