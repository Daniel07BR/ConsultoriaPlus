'use client';
// Feed de estudos / Estudos salvos. Extraído de AppClient (Fase 2).
import { IconSearch } from '../icons';
import { chipBase, dateInput, miniBtn } from '../ui/formKit';
import { useApp } from '../AppProvider';
import { StudyCardEl } from './StudyCardEl';

export function FeedView() {
  const { view, feed, studies, dateFrom, setDateFrom, dateTo, setDateTo, search, setSearch, catNames, filter, setFilter, colorOf } = useApp();
  const isSaved = view === 'saved';
  const isGestao = feed === 'gestao';
  const list = studies;
  const heading = isSaved ? 'Estudos salvos' : isGestao ? 'Feed de Gestão' : 'Feed de estudos';
  const subtitle = isSaved
    ? 'Conteúdos que você guardou para ler depois.'
    : isGestao
      ? 'Publicações da liderança — gestores, encarregados, diretoria e consultoria. Publique, curta e comente.'
      : 'Conteúdos da equipe de consultoria. Curta, comente e tire suas dúvidas.';
  return (
    <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
      <h1 className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{heading}</h1>
      <p style={{ margin: '0 0 18px', color: 'var(--fg2)', fontSize: 15 }}>{subtitle}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg2)' }}>Período de publicação:</span>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={dateInput} />
        <span style={{ color: 'var(--fg3)', fontSize: 13 }}>até</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={dateInput} />
        {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={miniBtn}>Limpar</button>}
      </div>

      {!isSaved && (
        <>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}><IconSearch size={18} stroke="var(--fg3)" /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar estudos, temas ou autores…" style={{ width: '100%', padding: '13px 16px 13px 44px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 14.5, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 24 }}>
            {['Todos', ...catNames].map((c) => {
              const active = filter === c;
              return (
                <button key={c} onClick={() => setFilter(c)} style={{ ...chipBase, background: active ? 'var(--accent)' : 'var(--surface)', color: active ? '#fff' : 'var(--fg2)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}` }}>
                  {c !== 'Todos' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorOf(c) }} />}{c}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {list.map((s) => <StudyCardEl key={s.id} s={s} />)}
      </div>
      {list.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg3)' }}>
          <div className="font-grotesk" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg2)' }}>{isSaved ? 'Nenhum estudo salvo' : 'Nenhum estudo encontrado'}</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>{isSaved ? 'Toque no marcador de um estudo para guardá-lo aqui.' : 'Tente outra busca ou categoria.'}</div>
        </div>
      )}
    </div>
  );
}
