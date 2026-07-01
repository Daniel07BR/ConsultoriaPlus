'use client';
// Inbox de comentários e perguntas nas publicações (feed estudos/gestão).
// Pergunta e comentário têm ícone e cor distintos; clique leva à publicação
// posicionada no comentário. Extraído de AppClient (Fase 2).
import { IconCheck, IconRefresh, IconQuestion, IconComment } from '../icons';
import { timeAgo } from '@/lib/present';
import { useApp } from '../AppProvider';

// Estilo por tipo: pergunta (âmbar, precisa de resposta) vs comentário (azul).
function kindStyle(kind: string) {
  if (kind === 'pergunta') {
    return { label: 'Pergunta', color: '#e0902a', bg: 'rgba(245,166,35,0.16)', Icon: IconQuestion };
  }
  return { label: 'Comentário', color: '#3b7fd6', bg: 'rgba(59,130,246,0.14)', Icon: IconComment };
}

export function NotificationsView() {
  const { unreadCount, markAllRead, notifications, openNotif, notifTotal, loadMoreNotifications } = useApp();
  return (
    <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
        <h1 className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Comentários e perguntas</h1>
        {unreadCount > 0 && <button onClick={markAllRead} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}><IconCheck size={15} sw={2.2} /> Marcar todas como lidas</button>}
      </div>
      <p style={{ margin: '0 0 22px', color: 'var(--fg2)', fontSize: 15 }}>Comentários e perguntas nas publicações. Clique para abrir a publicação no ponto exato e responder.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {notifications.map((n) => {
          const k = kindStyle(n.kind);
          return (
            <button key={n.id} onClick={() => openNotif(n)} style={{ textAlign: 'left', color: 'var(--fg)', display: 'flex', alignItems: 'flex-start', gap: 14, background: n.read ? 'var(--surface)' : 'var(--accent-soft)', border: `1px solid ${n.read ? 'var(--border)' : 'var(--accent)'}`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><k.Icon size={20} stroke={k.color} sw={2.2} /></div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 999, background: k.bg, color: k.color, fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em' }}>{k.label}</span>
                </div>
                <div style={{ fontSize: 14.5, lineHeight: 1.5 }}><span style={{ fontWeight: 700 }}>{n.title}</span> <span style={{ color: 'var(--fg2)' }}>{n.body}</span></div>
                <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
              </div>
              {!n.read && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />}
            </button>
          );
        })}
        {notifications.length === 0 && <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--fg3)', fontSize: 14 }}>Nenhum comentário ou pergunta por enquanto.</div>}
      </div>
      {notifications.length < notifTotal && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <button onClick={loadMoreNotifications} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}><IconRefresh size={15} sw={2.2} /> Carregar mais</button>
          <span style={{ fontSize: 12, color: 'var(--fg3)' }}>{notifications.length} de {notifTotal}</span>
        </div>
      )}
    </div>
  );
}
