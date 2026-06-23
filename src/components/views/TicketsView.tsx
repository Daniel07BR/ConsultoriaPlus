'use client';
// Lista de chamados (fila/meus + histórico). Extraído de AppClient (Fase 2).
import { IconPlus, IconSearch } from '../icons';
import { chipBase, inputStyle, dateInput, miniBtn } from '../ui/formKit';
import { useApp } from '../AppProvider';
import { TicketCardItem } from './TicketCardItem';

export function TicketsView() {
  const { setTicketTab, loadHistory, hist, setHist, ticketTab, isConsultor, startNewTicket, ticketFilter, setTicketFilter, loadTickets, tickets, historyTickets } = useApp();
  // Finalizados (fechado) saem da fila e ficam só no Histórico.
  const tf = ['todos', 'aberto', 'andamento', 'respondido'];
  const tfLabel: Record<string, string> = { todos: 'Todos', aberto: 'Aberto', andamento: 'Em andamento', respondido: 'Respondido' };
  const tab = (k: 'meus' | 'historico', label: string) => (
    <button onClick={() => { setTicketTab(k); if (k === 'historico') loadHistory(hist); }} style={{ padding: '9px 16px', borderRadius: 11, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk',sans-serif", background: ticketTab === k ? 'var(--accent-soft)' : 'transparent', color: ticketTab === k ? 'var(--accent)' : 'var(--fg2)' }}>{label}</button>
  );
  return (
    <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
        <h1 className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Chamados</h1>
        <button onClick={startNewTicket} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 5px 14px var(--accent-soft)', whiteSpace: 'nowrap' }}><IconPlus size={16} sw={2.6} /> Abrir chamado</button>
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 13, padding: 4, marginBottom: 20, width: 'fit-content' }}>
        {tab('meus', isConsultor ? 'Fila de atendimento' : 'Meus chamados')}
        {tab('historico', 'Histórico (todos)')}
      </div>

      {ticketTab === 'meus' ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 22 }}>
            {tf.map((k) => { const active = ticketFilter === k; return <button key={k} onClick={() => { setTicketFilter(k); loadTickets(k); }} style={{ ...chipBase, background: active ? 'var(--accent)' : 'var(--surface)', color: active ? '#fff' : 'var(--fg2)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}` }}>{tfLabel[k]}</button>; })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{tickets.map((t) => <TicketCardItem key={t.id} t={t} />)}</div>
          {tickets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg3)' }}>
              <div className="font-grotesk" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg2)' }}>Nenhum chamado neste filtro</div>
              <div style={{ fontSize: 14, marginTop: 6 }}>Altere o filtro de status acima.</div>
            </div>
          )}
        </>
      ) : (
        <>
          <p style={{ margin: '0 0 14px', color: 'var(--fg2)', fontSize: 14 }}>Todos os chamados do sistema. Busque por título, por quem abriu ou por período.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 22, alignItems: 'center' }}>
            <input value={hist.q} onChange={(e) => setHist({ ...hist, q: e.target.value })} placeholder="Título do chamado…" style={{ ...inputStyle(), flex: '1 1 200px', padding: '10px 13px', fontSize: 13.5 }} />
            <input value={hist.requester} onChange={(e) => setHist({ ...hist, requester: e.target.value })} placeholder="Quem abriu…" style={{ ...inputStyle(), flex: '1 1 160px', padding: '10px 13px', fontSize: 13.5 }} />
            <input type="date" value={hist.from} onChange={(e) => setHist({ ...hist, from: e.target.value })} style={dateInput} />
            <span style={{ color: 'var(--fg3)', fontSize: 13 }}>até</span>
            <input type="date" value={hist.to} onChange={(e) => setHist({ ...hist, to: e.target.value })} style={dateInput} />
            <button onClick={() => loadHistory(hist)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><IconSearch size={15} stroke="#fff" /> Buscar</button>
            {(hist.q || hist.requester || hist.from || hist.to) && <button onClick={() => { const empty = { q: '', requester: '', from: '', to: '' }; setHist(empty); loadHistory(empty); }} style={miniBtn}>Limpar</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{historyTickets.map((t) => <TicketCardItem key={t.id} t={t} />)}</div>
          {historyTickets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg3)' }}>
              <div className="font-grotesk" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg2)' }}>Nenhum chamado encontrado</div>
              <div style={{ fontSize: 14, marginTop: 6 }}>Ajuste a busca ou o período.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
