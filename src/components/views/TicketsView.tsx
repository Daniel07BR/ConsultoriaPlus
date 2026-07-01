'use client';
// Lista de chamados. Aba "Ao Vivo" (fila): página única com os chamados não
// fechados agrupados — Novo Chamado (aberto) → Aguardando resposta (andamento) →
// Respondidos — sempre o mais atualizado por cima. Aba "Histórico": todos, com busca.
import { IconPlus, IconSearch, IconCheck } from '../icons';
import { inputStyle, dateInput, miniBtn } from '../ui/formKit';
import { useApp } from '../AppProvider';
import { TicketCardItem } from './TicketCardItem';
import type { TicketCard } from '@/lib/types';

export function TicketsView() {
  const { setTicketTab, loadHistory, hist, setHist, ticketTab, isConsultor, startNewTicket, tickets, historyTickets, unseenTicketCount, markAllTicketsSeen } = useApp();

  // tickets já vem ordenado por updatedAt desc (mais atualizado por cima).
  const novos = tickets.filter((t) => t.status === 'aberto');
  const aguardando = tickets.filter((t) => t.status === 'andamento');
  const respondidos = tickets.filter((t) => t.status === 'respondido');

  const tab = (k: 'meus' | 'historico', label: string) => (
    <button onClick={() => { setTicketTab(k); if (k === 'historico') loadHistory(hist); }} style={{ padding: '9px 16px', borderRadius: 11, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk',sans-serif", background: ticketTab === k ? 'var(--accent-soft)' : 'transparent', color: ticketTab === k ? 'var(--accent)' : 'var(--fg2)' }}>{label}</button>
  );

  const Group = ({ label, list, muted }: { label: string; list: TicketCard[]; muted?: boolean }) => (
    list.length === 0 ? null : (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
          <span style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 800, letterSpacing: '.06em', color: muted ? 'var(--fg3)' : 'var(--fg2)' }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg3)' }}>· {list.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{list.map((t) => <TicketCardItem key={t.id} t={t} />)}</div>
      </div>
    )
  );

  return (
    <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
        <h1 className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Chamados</h1>
        <button onClick={startNewTicket} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 5px 14px var(--accent-soft)', whiteSpace: 'nowrap' }}><IconPlus size={16} sw={2.6} /> Abrir chamado</button>
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 13, padding: 4, marginBottom: 20, width: 'fit-content' }}>
        {tab('meus', isConsultor ? 'Ao Vivo' : 'Meus chamados')}
        {tab('historico', 'Histórico (todos)')}
      </div>

      {ticketTab === 'meus' ? (
        <>
          {/* Cabeçalho "Ao Vivo" — reúne aberto + em andamento; carrega o mesmo número do menu. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span className="cp-live-dot" style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} />
              <span className="font-grotesk" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Ao Vivo</span>
              {unseenTicketCount > 0 && (
                <span title={`${unseenTicketCount} sem visualização`} style={{ minWidth: 22, height: 22, padding: '0 7px', borderRadius: 999, background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px var(--accent-soft)' }}>{unseenTicketCount}</span>
              )}
            </div>
            <div style={{ flex: 1 }} />
            {unseenTicketCount > 0 && (
              <button onClick={markAllTicketsSeen} title="Marcar todos os chamados como vistos" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}><IconCheck size={15} sw={2.2} /> Marcar todos como vistos</button>
            )}
          </div>

          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg3)' }}>
              <div className="font-grotesk" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg2)' }}>Nenhum chamado na fila</div>
              <div style={{ fontSize: 14, marginTop: 6 }}>Chamados fechados ficam no Histórico.</div>
            </div>
          ) : (
            <>
              <Group label="Novo Chamado" list={novos} />
              <Group label="Aguardando resposta" list={aguardando} />
              {novos.length === 0 && aguardando.length === 0 && (
                <div style={{ color: 'var(--fg3)', fontSize: 14, margin: '0 0 24px' }}>Nenhum chamado ao vivo agora.</div>
              )}
              {respondidos.length > 0 && <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0 22px' }} />}
              <Group label="Respondidos" list={respondidos} muted />
            </>
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
