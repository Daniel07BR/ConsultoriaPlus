'use client';
// Perfil / minha área (stats, atalhos, atividade recente). Extraído (Fase 2).
import Avatar from '../Avatar';
import { IconLogout, IconBookmark, IconTicket } from '../icons';
import { timeAgo } from '@/lib/present';
import { useApp } from '../AppProvider';
import { NotifIcon } from './NotifIcon';

export function ProfileView() {
  const { isConsultor, studies, openTicketCount, tickets, savedCount, me, acting, logout, goSaved, goTickets, notifications, openNotif } = useApp();
  const stats = isConsultor
    ? [{ n: studies.length, l: 'Estudos no feed' }, { n: studies.reduce((a, s) => a + s.likes, 0), l: 'Curtidas no feed' }, { n: openTicketCount, l: 'Chamados ativos' }]
    : [{ n: tickets.length, l: 'Chamados abertos' }, { n: savedCount, l: 'Estudos salvos' }, { n: studies.filter((s) => s.liked).length, l: 'Estudos curtidos' }];
  return (
    <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 1px 3px var(--shadow)', padding: 28, display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
        <Avatar name={me.user.name} avatar={me.user.avatar} size={68} role={acting} font={24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-grotesk" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{me.user.name}</div>
          <div style={{ fontSize: 14, color: 'var(--fg2)', marginTop: 2 }}>{[me.user.cargo, me.user.department].filter(Boolean).join(' · ')}</div>
        </div>
        <button onClick={logout} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, border: 'none', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}><IconLogout size={15} sw={2.2} /> Sair</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
        {stats.map((st, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{st.n}</div>
            <div style={{ fontSize: 13, color: 'var(--fg2)', marginTop: 7, fontWeight: 600 }}>{st.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>
        <button onClick={goSaved} style={{ flex: 1, textAlign: 'left', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconBookmark size={19} fill="var(--accent)" stroke="var(--accent)" /></div>
          <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>Estudos salvos</div><div style={{ fontSize: 12.5, color: 'var(--fg3)' }}>{savedCount} guardados</div></div>
        </button>
        <button onClick={goTickets} style={{ flex: 1, textAlign: 'left', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconTicket size={19} stroke="var(--accent)" /></div>
          <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>{isConsultor ? 'Chamados' : 'Meus chamados'}</div><div style={{ fontSize: 12.5, color: 'var(--fg3)' }}>{openTicketCount} ativos</div></div>
        </button>
      </div>
      <h2 className="font-grotesk" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 14px' }}>Atividade recente</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {notifications.slice(0, 6).map((n) => (
          <button key={n.id} onClick={() => openNotif(n)} style={{ textAlign: 'left', color: 'var(--fg)', display: 'flex', alignItems: 'flex-start', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '15px 18px', cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><NotifIcon kind={n.kind} /></div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}><span style={{ fontWeight: 700 }}>{n.title}</span> <span style={{ color: 'var(--fg2)' }}>{n.body}</span></div>
              <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
            </div>
          </button>
        ))}
        {notifications.length === 0 && <div style={{ color: 'var(--fg3)', fontSize: 14 }}>Sem atividade recente.</div>}
      </div>
    </div>
  );
}
