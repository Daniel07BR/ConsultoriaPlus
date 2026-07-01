'use client';
// Inbox de comentários e perguntas nas publicações (feed estudos/gestão).
// Pergunta e comentário têm ícone e cor distintos; clique leva à publicação
// posicionada no comentário. Extraído de AppClient (Fase 2).
import { IconCheck, IconRefresh, IconQuestion, IconComment } from '../icons';
import { timeAgo } from '@/lib/present';
import { useApp } from '../AppProvider';
import Avatar from '../Avatar';

// Estilo por tipo: pergunta (âmbar, precisa de resposta) vs comentário (azul).
function kindStyle(kind: string) {
  if (kind === 'pergunta') {
    return { label: 'Pergunta', color: '#e0902a', bg: 'rgba(245,166,35,0.16)', Icon: IconQuestion };
  }
  return { label: 'Comentário', color: '#3b7fd6', bg: 'rgba(59,130,246,0.14)', Icon: IconComment };
}

export function NotificationsView() {
  const { unreadCount, markAllRead, notifications, openNotif, notifTotal, loadMoreNotifications, openQuestions, openStudy } = useApp();
  return (
    <div style={{ paddingTop: 32, animation: 'cpFade .35s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
        <h1 className="font-grotesk" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Comentários e perguntas</h1>
        {unreadCount > 0 && <button onClick={markAllRead} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}><IconCheck size={15} sw={2.2} /> Marcar todas como lidas</button>}
      </div>
      <p style={{ margin: '0 0 22px', color: 'var(--fg2)', fontSize: 15 }}>Comentários e perguntas nas publicações. Clique para abrir a publicação no ponto exato e responder.</p>

      {/* Perguntas em aberto (ao vivo): o que ainda precisa de resposta, em destaque
          âmbar, no topo — independe de "quem foi avisado". Só aparece p/ consultor. */}
      {openQuestions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
            <span className="cp-alert-dot" style={{ width: 9, height: 9, borderRadius: '50%', background: '#f5a623' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#c47d10' }}>Perguntas em aberto · {openQuestions.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {openQuestions.map((q) => (
              <button key={q.commentId} onClick={() => openStudy(q.studyId, q.feed, q.commentId)} style={{ textAlign: 'left', color: 'var(--fg)', display: 'flex', alignItems: 'flex-start', gap: 14, background: 'rgba(245,166,35,0.10)', border: '1px solid #f5a623', borderRadius: 16, padding: '16px 18px', cursor: 'pointer', boxShadow: '0 0 0 1px rgba(245,166,35,0.35)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar name={q.author.name} avatar={q.author.avatar} size={44} role="cliente" />
                  <span className="cp-alert-dot" style={{ position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: '50%', background: '#f5a623', border: '2px solid var(--surface)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><IconQuestion size={12} stroke="#fff" sw={2.6} /></span>
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                  <div style={{ marginBottom: 3 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 999, background: 'rgba(245,166,35,0.18)', color: '#c47d10', fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em' }}>Pergunta em aberto</span></div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.5 }}><span style={{ fontWeight: 700 }}>{q.author.name}</span> <span style={{ color: 'var(--fg2)' }}>perguntou em “{q.studyTitle}”.</span></div>
                  <div style={{ fontSize: 13.5, color: 'var(--fg2)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.text}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginTop: 4 }}>{timeAgo(q.createdAt)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {notifications.length > 0 && openQuestions.length > 0 && (
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--fg3)', margin: '0 0 11px' }}>Histórico</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {notifications.map((n) => {
          const k = kindStyle(n.kind);
          return (
            <button key={n.id} onClick={() => openNotif(n)} style={{ textAlign: 'left', color: 'var(--fg)', display: 'flex', alignItems: 'flex-start', gap: 14, background: n.read ? 'var(--surface)' : 'var(--accent-soft)', border: `1px solid ${n.read ? 'var(--border)' : 'var(--accent)'}`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar name={n.title} avatar={n.authorAvatar} size={44} role="cliente" />
                <span style={{ position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: '50%', background: k.color, border: '2px solid var(--surface)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><k.Icon size={12} stroke="#fff" sw={2.6} /></span>
              </div>
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
        {notifications.length === 0 && openQuestions.length === 0 && <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--fg3)', fontSize: 14 }}>Nenhum comentário ou pergunta por enquanto.</div>}
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
