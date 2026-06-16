'use client';
import { useState } from 'react';
import { youtubeId, youtubeThumb } from '@/lib/present';
import { IconX, IconPlay } from './icons';

export interface VideoInput {
  id?: string;
  title: string;
  description: string;
  url: string;
  tab: 'treinamento' | 'sugerido';
}

export default function VideoForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: VideoInput;
  onSave: (v: VideoInput) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [url, setUrl] = useState(initial?.url || '');
  const [tab, setTab] = useState<'treinamento' | 'sugerido'>(initial?.tab || 'treinamento');
  const [busy, setBusy] = useState(false);

  const yid = youtubeId(url);
  const valid = !!title.trim() && !!yid;

  const inp: React.CSSProperties = { width: '100%', padding: '11px 13px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg)', fontSize: 14, outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontWeight: 700, fontSize: 13, color: 'var(--fg2)', marginBottom: 7 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="font-grotesk" style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--fg)' }}>{initial?.id ? 'Editar vídeo' : 'Adicionar vídeo'}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--surface2)', borderRadius: 9, width: 32, height: 32, cursor: 'pointer', color: 'var(--fg2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconX size={16} sw={2.4} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Aba</label>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 11, padding: 4 }}>
              {(['treinamento', 'sugerido'] as const).map((tk) => (
                <button key={tk} onClick={() => setTab(tk)} style={{ flex: 1, padding: '8px 10px', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", background: tab === tk ? 'var(--accent)' : 'transparent', color: tab === tk ? '#fff' : 'var(--fg2)' }}>{tk === 'treinamento' ? 'Treinamento' : 'Vídeo sugerido'}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Link do YouTube</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" style={inp} />
            {url.trim() && !yid && <div style={{ fontSize: 12.5, color: '#e0457a', marginTop: 6 }}>Link do YouTube inválido.</div>}
          </div>
          {yid && (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={youtubeThumb(yid)} alt="capa" style={{ width: '100%', display: 'block', aspectRatio: '16 / 9', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,92,137,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPlay size={24} fill="#fff" stroke="#fff" /></span>
              </div>
            </div>
          )}
          <div>
            <label style={lbl}>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Como emitir nota fiscal" style={inp} />
          </div>
          <div>
            <label style={lbl}>Descrição <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>(opcional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Breve descrição do vídeo…" style={{ ...inp, lineHeight: 1.5 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{ padding: '11px 18px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button disabled={!valid || busy} onClick={async () => { setBusy(true); await onSave({ id: initial?.id, title: title.trim(), description: description.trim(), url: url.trim(), tab }); setBusy(false); }} style={{ padding: '11px 22px', borderRadius: 11, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: valid ? 'pointer' : 'not-allowed', opacity: valid ? 1 : 0.5 }}>{busy ? 'Salvando…' : initial?.id ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
