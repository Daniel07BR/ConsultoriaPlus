'use client';
// Publicar/editar estudo. Extraído de AppClient (Fase 2).
import { IconArrowLeft, IconFile, IconExternal, IconX, IconImage, IconPlus } from '../icons';
import { Field, inputStyle, labelStyle, attachPill, pillX } from '../ui/formKit';
import { attIcon } from '../ui/attIcon';
import { linkKind, linkLabel } from '@/lib/present';
import { useApp } from '../AppProvider';

export function ComposeView() {
  const { compose, feed, firstCat, cancelCompose, editingStudyId, setCompose, coverUploading, uploadCover, setCatManagerOpen, catNames, addComposeLink, publishStudy, gestaoDepartments } = useApp();
  const selectedCat = compose.category || firstCat;
  const isGestao = feed === 'gestao';
  // Audiência por departamento (Feed de Gestão): um depto está OCULTO se estiver em
  // compose.excludedDepts. Por padrão nenhum está oculto → todos os líderes recebem.
  const excludedSet = new Set(compose.excludedDepts);
  const toggleDept = (name: string) => setCompose((c) => {
    const set = new Set(c.excludedDepts);
    if (set.has(name)) set.delete(name); else set.add(name);
    return { ...c, excludedDepts: [...set] };
  });
  const setAllDepts = (hidden: boolean) => setCompose((c) => ({ ...c, excludedDepts: hidden ? gestaoDepartments.map((d) => d.name) : [] }));
  const hiddenNames = gestaoDepartments.filter((d) => excludedSet.has(d.name)).map((d) => d.name);
  const heading = editingStudyId
    ? (isGestao ? 'Editar publicação' : 'Editar estudo')
    : (isGestao ? 'Nova publicação de gestão' : 'Publicar novo estudo');
  const subtitle = isGestao
    ? 'Compartilhe com a liderança. Adicione imagem de capa, vídeos do YouTube, arquivos do Drive e links.'
    : 'Compartilhe conteúdo com os clientes. Adicione imagem de capa, vídeos do YouTube, arquivos do Drive e links.';
  return (
    <div style={{ paddingTop: 28, animation: 'cpFade .35s ease' }}>
      <button onClick={cancelCompose} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 22 }}><IconArrowLeft size={15} sw={2.4} /> Cancelar</button>
      <h1 className="font-grotesk" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{heading}</h1>
      <p style={{ margin: '0 0 16px', color: 'var(--fg2)', fontSize: 15 }}>{subtitle}</p>
      {/* Atalho: pasta do Google Drive onde a consultoria mantém as matérias (só no feed de estudos) */}
      {!isGestao && (
      <a
        href="https://drive.google.com/drive/folders/11jn6CLRjNK-Sijl87BZqhcytUWP_3-AA"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', marginBottom: 22, borderRadius: 14,
          background: 'var(--accent-soft)', border: '1px solid var(--accent)',
          color: 'var(--accent)', textDecoration: 'none', fontWeight: 700, fontSize: 13.5,
          boxShadow: '0 4px 14px rgba(255, 92, 137, 0.12)',
        }}
        title="Abrir a pasta de matérias no Google Drive (nova aba)"
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, background: '#fff', color: 'var(--accent)' }}>
          <IconFile size={17} stroke="var(--accent)" />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span>Pasta de matérias no Drive</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg3)' }}>Atalho — abre em nova aba</span>
        </span>
        <IconExternal size={15} stroke="currentColor" sw={2.2} style={{ marginLeft: 'auto' }} />
      </a>
      )}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 1px 3px var(--shadow)', padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Título"><input value={compose.title} onChange={(e) => setCompose({ ...compose, title: e.target.value })} placeholder="Ex.: Reforma tributária — o que muda em 2026" style={inputStyle(true)} /></Field>

        {/* Imagem de capa */}
        <div>
          <label style={labelStyle}>Imagem de capa <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>(opcional — aparece centralizada no topo do estudo)</span></label>
          {compose.coverImage ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={compose.coverImage} alt="capa" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 14, display: 'block', border: '1px solid var(--border)' }} />
              <button onClick={() => setCompose((c) => ({ ...c, coverImage: null }))} title="Remover capa" style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconX size={16} sw={2.4} /></button>
            </div>
          ) : (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, border: '1.5px dashed var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <IconImage size={16} stroke="var(--accent)" />{coverUploading ? 'Enviando…' : 'Enviar imagem'}
              <input type="file" accept="image/*" style={{ display: 'none' }} disabled={coverUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.currentTarget.value = ''; }} />
            </label>
          )}
        </div>

        {/* Categoria + gerenciar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Categoria</label>
            <button onClick={() => setCatManagerOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--accent)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}><IconPlus size={13} sw={2.4} />Gerenciar categorias</button>
          </div>
          <select value={selectedCat} onChange={(e) => setCompose({ ...compose, category: e.target.value })} style={{ ...inputStyle(), cursor: 'pointer' }}>{catNames.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>

        {/* Audiência por departamento — só no Feed de Gestão */}
        {isGestao && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Quem recebe <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>(por departamento)</span></label>
              {gestaoDepartments.length > 0 && (
                <div style={{ display: 'inline-flex', gap: 6 }}>
                  <button type="button" onClick={() => setAllDepts(false)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}>Marcar todos</button>
                  <button type="button" onClick={() => setAllDepts(true)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}>Desmarcar todos</button>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginBottom: 12 }}>
              Por padrão a publicação vai para <b>toda a liderança</b>. Desmarque um departamento para <b>ocultá-lo</b>: o Gestor e o Sub-encarregado daquele setor não recebem o alerta nem conseguem ver esta publicação. Diretoria, Consultoria e T.I sempre veem.
            </div>
            {gestaoDepartments.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--fg3)', padding: '12px 14px', borderRadius: 12, border: '1px dashed var(--border)', background: 'var(--surface2)' }}>
                Nenhum departamento com Gestor/Sub-encarregado cadastrado — a publicação vai para toda a liderança.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                {gestaoDepartments.map((d) => {
                  const on = !excludedSet.has(d.name); // marcado = recebe
                  return (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => toggleDept(d.name)}
                      title={on ? 'Recebe esta publicação — clique para ocultar' : 'Oculto — clique para incluir'}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 13px', borderRadius: 999, cursor: 'pointer',
                        border: on ? '1px solid var(--accent)' : '1px dashed var(--border)',
                        background: on ? 'var(--accent-soft)' : 'var(--surface2)',
                        color: on ? 'var(--accent)' : 'var(--fg3)',
                        fontWeight: 700, fontSize: 13,
                        textDecoration: on ? 'none' : 'line-through',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 5, border: on ? 'none' : '1.5px solid var(--fg3)', background: on ? 'var(--accent)' : 'transparent', color: '#fff', fontSize: 11 }}>{on ? '✓' : ''}</span>
                      {d.name}
                      <span style={{ fontWeight: 600, fontSize: 11, opacity: 0.8 }}>{d.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {hiddenNames.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: '#c47d10', fontWeight: 600 }}>
                Oculto para: {hiddenNames.join(', ')}
              </div>
            )}
          </div>
        )}

        <Field label="Conteúdo"><textarea value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} rows={7} placeholder="Escreva o estudo aqui. Use parágrafos para organizar as ideias…" style={{ ...inputStyle(), lineHeight: 1.65 }} /></Field>

        {/* Links: vídeo do YouTube, arquivo do Drive ou site */}
        <div>
          <label style={labelStyle}>Vídeos, arquivos e links</label>
          <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginBottom: 10 }}>Cole um link do <b>YouTube</b>, do <b>Google Drive</b> ou de qualquer <b>site</b>. Vídeos e arquivos do Drive abrem dentro da plataforma.</div>
          <div style={{ display: 'flex', gap: 9, marginBottom: 12 }}>
            <input value={compose.linkInput} onChange={(e) => setCompose({ ...compose, linkInput: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addComposeLink(); } }} placeholder="https://youtube.com/…  ·  https://drive.google.com/…  ·  https://…" style={{ ...inputStyle(), flex: 1, padding: '11px 14px', fontSize: 13.5 }} />
            <button onClick={addComposeLink} style={{ padding: '11px 18px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Adicionar</button>
          </div>
          {compose.links.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {compose.links.map((l, i) => (
                <span key={i} style={attachPill}>{attIcon(linkKind(l.url), 14)}{linkLabel(l.url)}<button onClick={() => setCompose((c) => ({ ...c, links: c.links.filter((_, j) => j !== i) }))} style={pillX}><IconX size={14} sw={2.4} /></button></span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          <button onClick={cancelCompose} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={publishStudy} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 18px var(--accent-soft)' }}>{editingStudyId ? 'Salvar alterações' : 'Publicar estudo'}</button>
        </div>
      </div>
    </div>
  );
}
