'use client';
// Leitura de um estudo + interações (comentários/perguntas). Extraído (Fase 2).
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';
import { IconArrowLeft, IconThumbsUp, IconBookmark, IconX, IconPlay, IconExternal, IconQuestion } from '../icons';
import { attIcon } from '../ui/attIcon';
import { LikesHoverButton } from '../ui/LikesHoverButton';
import { miniBtn } from '../ui/formKit';
import { timeAgo } from '@/lib/present';
import { useApp } from '../AppProvider';
import { Linkify } from './Linkify';

export function StudyView() {
  const {
    activeStudy, goFeed, goGestao, colorOf, openLink, toggleLike, openViews, toggleSave, me, startEditStudy, deleteStudy,
    commentInputRef, commentDraft, setCommentDraft, submitComment, isConsultor, commentIsQuestion, setCommentIsQuestion,
    acting, editingComment, setEditingComment, setActing, saveComment, deleteComment,
  } = useApp();
  const s = activeStudy;
  // Vindo de uma notificação (`/estudos/:id#c-<commentId>`): ao carregar os
  // comentários, rola até o comentário/pergunta e o destaca por alguns segundos.
  const [highlightId, setHighlightId] = useState<string | null>(null);
  useEffect(() => {
    if (!s?.comments?.length) return;
    const m = window.location.hash.match(/^#c-(.+)$/);
    if (!m) return;
    const cid = m[1];
    const el = document.getElementById(`c-${cid}`);
    if (!el) return;
    setHighlightId(cid);
    requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    const timer = setTimeout(() => setHighlightId(null), 2800);
    return () => clearTimeout(timer);
  }, [s?.id, s?.comments?.length]);
  if (!s) return <div style={{ paddingTop: 60, textAlign: 'center', color: 'var(--fg3)' }}>Carregando…</div>;
  const isGestao = s.feed === 'gestao';
  // Editar: estudos → consultor/admin; gestão → só o autor. Excluir: + diretoria/admin.
  const canEditStudy = isGestao ? s.mine : me.canConsultor;
  const canDeleteStudy = isGestao ? (s.mine || me.role === 'both') : me.canConsultor;
  return (
    <div style={{ paddingTop: 28, animation: 'cpFade .35s ease' }}>
      <button onClick={isGestao ? goGestao : goFeed} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 22 }}><IconArrowLeft size={15} sw={2.4} /> {isGestao ? 'Voltar à Gestão' : 'Voltar ao feed'}</button>
      <article style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, boxShadow: '0 1px 3px var(--shadow)', padding: '34px 38px' }}>
        {s.coverImage && (
          <div style={{ textAlign: 'center', margin: '0 0 24px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.coverImage} alt="" style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 16, display: 'inline-block' }} />
          </div>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 13px', borderRadius: 999, background: 'var(--accent-soft)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 18 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: colorOf(s.category) }} />{s.category}</span>
        <h1 className="font-grotesk" style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.18, margin: '0 0 20px' }}>{s.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          <Avatar name={s.author.name} avatar={s.author.avatar} size={46} role="consultor" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 700, fontSize: 15 }}>{s.author.name}</span>{s.author.department && <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>{s.author.department}</span>}</div>
            <div style={{ fontSize: 13, color: 'var(--fg3)' }}>{[s.author.title, timeAgo(s.createdAt), s.readTime && `${s.readTime} de leitura`].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        <div style={{ fontSize: 16.5, lineHeight: 1.75, color: 'var(--fg)' }}>{s.body.map((p, i) => <p key={i} style={{ margin: '0 0 18px', whiteSpace: 'pre-wrap' }}>{p}</p>)}</div>
        {s.attachments.length > 0 && (
          <div style={{ marginTop: 26, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <div className="font-grotesk" style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg2)', marginBottom: 13 }}>Anexos e referências</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {s.attachments.map((a, i) => {
                const embeddable = a.kind === 'video' || a.kind === 'drive';
                return (
                  <button key={i} onClick={() => a.url && openLink(a.url)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{attIcon(a.kind, 20)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div><div style={{ fontSize: 12.5, color: 'var(--fg3)' }}>{a.meta || (embeddable ? 'Abrir aqui na plataforma' : 'Abrir em nova aba')}</div></div>
                    {embeddable ? <IconPlay size={18} fill="var(--fg3)" stroke="var(--fg3)" /> : <IconExternal size={18} stroke="var(--fg3)" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 26, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
          <LikesHoverButton studyId={s.id} count={s.likes} liked={s.liked} onToggle={() => toggleLike(s.id)} label="curtidas" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: s.liked ? 'var(--accent)' : 'var(--fg2)' }} />
          <button onClick={() => openViews(s.id, s.title)} title="Marcar como visualizado e ver quem viu" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: s.viewed ? 'var(--accent)' : 'var(--fg2)' }}><IconThumbsUp size={19} fill={s.viewed ? 'var(--accent)' : 'none'} stroke={s.viewed ? 'var(--accent)' : 'currentColor'} />{s.views} visualizações</button>
          <button onClick={() => toggleSave(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: s.saved ? 'var(--accent)' : 'var(--fg2)' }}><IconBookmark size={18} fill={s.saved ? 'var(--accent)' : 'none'} stroke={s.saved ? 'var(--accent)' : 'currentColor'} />{s.saved ? 'Salvo' : 'Salvar estudo'}</button>
          {(canEditStudy || canDeleteStudy) && (
            <>
              <div style={{ flex: 1 }} />
              {canEditStudy && <button onClick={() => startEditStudy(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'var(--fg2)' }}>Editar</button>}
              {canDeleteStudy && <button onClick={() => deleteStudy(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#e0457a' }}><IconX size={16} sw={2.4} /></button>}
            </>
          )}
        </div>
      </article>

      <section style={{ marginTop: 24 }}>
        <h2 className="font-grotesk" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 16px' }}>Interações <span style={{ color: 'var(--fg3)', fontWeight: 600 }}>· {s.comments.length}</span></h2>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: '0 1px 3px var(--shadow)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar name={me.user.name} avatar={me.user.avatar} size={40} role={acting} />
            <div style={{ flex: 1 }}>
              <textarea ref={commentInputRef} value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }} placeholder={isConsultor ? 'Responda como consultor… (Enter envia · Shift+Enter quebra linha)' : 'Escreva um comentário ou pergunta… (Enter envia · Shift+Enter quebra linha)'} rows={2} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg)', fontSize: 14.5, lineHeight: 1.5, outline: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                {!isConsultor && (
                  <button onClick={() => setCommentIsQuestion((q) => !q)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, background: commentIsQuestion ? 'var(--accent)' : 'transparent', color: commentIsQuestion ? '#fff' : 'var(--fg2)', border: `1px solid ${commentIsQuestion ? 'var(--accent)' : 'var(--border)'}` }}><IconQuestion size={15} sw={2.2} />Marcar como pergunta</button>
                )}
                <div style={{ flex: 1 }} />
                <button onClick={submitComment} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 11, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Publicar</button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {s.comments.map((c) => {
            const isC = c.role === 'consultor';
            const hot = highlightId === c.id; // destaque ao chegar por notificação
            return (
              <div key={c.id} id={`c-${c.id}`} style={{ background: c.isQuestion ? 'var(--accent-soft)' : 'var(--surface2)', border: `1px solid ${hot ? 'var(--accent)' : (c.isQuestion ? 'var(--accent)' : 'var(--border)')}`, borderRadius: 16, padding: '16px 18px', boxShadow: hot ? '0 0 0 3px var(--accent-soft), 0 8px 24px var(--shadow)' : undefined, transition: 'box-shadow .3s ease, border-color .3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 9 }}>
                  <Avatar name={c.author.name} avatar={c.author.avatar} size={36} role={isC ? 'consultor' : 'cliente'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{c.author.name}</span>
                      {c.author.department && <span style={isC ? { background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '.03em' } : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg3)', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{c.author.department}</span>}
                      {c.isQuestion && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent)', color: '#fff', padding: '2px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em' }}>PERGUNTA</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg3)' }}>{timeAgo(c.createdAt)}</div>
                  </div>
                  {(c.mine || me.canConsultor) && editingComment?.id !== c.id && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {c.isQuestion && me.canConsultor && (
                        <button
                          onClick={() => {
                            setActing('consultor');
                            setCommentIsQuestion(false);
                            setCommentDraft((d) => d || `@${c.author.name.split(' ')[0]}, `);
                            setTimeout(() => commentInputRef.current?.focus(), 0);
                          }}
                          style={{ ...miniBtn, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700 }}
                        >Responder</button>
                      )}
                      {c.mine && <button onClick={() => setEditingComment({ id: c.id, text: c.text })} style={miniBtn}>Editar</button>}
                      <button onClick={() => deleteComment(c.id)} title="Excluir" style={{ ...miniBtn, color: '#e0457a' }}><IconX size={13} sw={2.4} /></button>
                    </div>
                  )}
                </div>
                {editingComment?.id === c.id ? (
                  <div>
                    <textarea value={editingComment.text} onChange={(e) => setEditingComment({ id: c.id, text: e.target.value })} rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 14, outline: 'none' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                      <button onClick={() => setEditingComment(null)} style={miniBtn}>Cancelar</button>
                      <button onClick={saveComment} style={{ ...miniBtn, background: 'var(--accent)', color: '#fff', border: 'none' }}>Salvar</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--fg)', whiteSpace: 'pre-wrap' }}><Linkify text={c.text} /></p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
