'use client';
import { useState } from 'react';
import { IconPlus, IconX, IconCheck } from './icons';

interface CategoryT { id: string; name: string; color: string }

const PALETTE = ['#ff5c89', '#e0457a', '#fb8cac', '#fda8bf', '#f06a98', '#f5a623', '#3f9e74', '#1a6cff', '#a855f7', '#06b6d4'];

export default function CategoryManager({
  categories,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: {
  categories: CategoryT[];
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (id: string, name: string, color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [busy, setBusy] = useState(false);

  const startEdit = (c: CategoryT) => { setEditId(c.id); setEditName(c.name); setEditColor(c.color); };

  const Swatches = ({ value, onPick }: { value: string; onPick: (c: string) => void }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {PALETTE.map((c) => (
        <button key={c} onClick={() => onPick(c)} title={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: value === c ? '2px solid var(--fg)' : '2px solid transparent', cursor: 'pointer' }} />
      ))}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="font-grotesk" style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--fg)' }}>Categorias</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--surface2)', borderRadius: 9, width: 32, height: 32, cursor: 'pointer', color: 'var(--fg2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconX size={16} sw={2.4} /></button>
        </div>

        {/* nova categoria */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--fg2)', marginBottom: 10 }}>Nova categoria</div>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da categoria" style={{ width: '100%', padding: '10px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 14, outline: 'none', marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Swatches value={newColor} onPick={setNewColor} />
            <button disabled={busy || !newName.trim()} onClick={async () => { setBusy(true); await onCreate(newName.trim(), newColor); setNewName(''); setBusy(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: newName.trim() ? 'pointer' : 'not-allowed', opacity: newName.trim() ? 1 : 0.5, whiteSpace: 'nowrap' }}><IconPlus size={14} sw={2.4} />Criar</button>
          </div>
        </div>

        {/* lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {categories.map((c) => (
            <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
              {editId === c.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg)', fontSize: 14, outline: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <Swatches value={editColor} onPick={setEditColor} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditId(null)} style={{ padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>Cancelar</button>
                      <button disabled={busy || !editName.trim()} onClick={async () => { setBusy(true); await onUpdate(c.id, editName.trim(), editColor); setEditId(null); setBusy(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 9, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}><IconCheck size={13} sw={2.4} />Salvar</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>{c.name}</span>
                  <button onClick={() => startEdit(c)} style={{ padding: '6px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--fg2)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>Editar</button>
                  <button onClick={() => onDelete(c.id)} title="Excluir" style={{ padding: '6px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface2)', color: '#e0457a', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><IconX size={14} sw={2.4} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
