'use client';
// Card de chamado nas listas (fila/meus/histórico). Era `tCard` em AppClient (Fase 2).
import Avatar from '../Avatar';
import { Hearts } from '../ui/Hearts';
import { IconComment, IconArrowRight, IconX } from '../icons';
import { ticketNumChip } from '../ui/formKit';
import { statusMeta, timeAgo, consultorColor } from '@/lib/present';
import { useApp } from '../AppProvider';
import type { TicketCard } from '@/lib/types';

export function TicketCardItem({ t }: { t: TicketCard }) {
  const { openTicket, colorOf, me, deleteTicket } = useApp();
  const sm = statusMeta(t.status);
  const hasUnseen = t.unseen > 0;
  // Chamado NOVO (aberto e ainda não visto): destaque em verde, distinto do
  // "N novas" (accent) de um chamado em andamento. Some quando o consultor entra.
  const isNew = t.status === 'aberto' && hasUnseen;
  const hi = isNew ? '#16a34a' : 'var(--accent)';
  const hiSoft = isNew ? 'rgba(22,163,74,0.20)' : 'var(--accent-soft)';
  // Quem está atendendo: o responsável que ASSUMIU tem prioridade (aponta mesmo sem
  // resposta); se ninguém assumiu, cai no último consultor que respondeu. A cor dele
  // vira um realce/sombra colorido nas bordas do card. Marina rosé, Edilaine teal.
  const handler = t.assignee ?? t.responder;
  const rc = handler ? consultorColor(handler.name) : null;
  const border = rc ? `${rc}66` : (hasUnseen ? hi : 'var(--border)');
  const shadow = rc
    ? `0 0 0 1px ${rc}66, 0 6px 20px ${rc}33`
    : (hasUnseen ? `0 0 0 1px ${hi}, 0 4px 14px ${hiSoft}` : '0 1px 3px var(--shadow)');
  return (
    <button onClick={() => openTicket(t.id)} style={{ textAlign: 'left', color: 'var(--fg)', background: 'var(--surface)', border: `1px solid ${border}`, borderRadius: 20, boxShadow: shadow, padding: '22px 24px', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {/* Foto de quem abriu + foto do consultor sobreposta no canto inferior direito. */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={t.author.name} avatar={t.author.avatar} size={44} role="cliente" />
          {handler && rc && (
            <span title={t.assignee ? `Atendendo: ${handler.name}` : `Atendido por ${handler.name}`} style={{ position: 'absolute', right: -6, bottom: -6, borderRadius: '50%', padding: 2, background: 'var(--surface)', boxShadow: `0 0 0 2px ${rc}`, display: 'inline-flex', lineHeight: 0 }}>
              <Avatar name={handler.name} avatar={handler.avatar} size={24} role="consultor" />
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: 'nowrap' }}>{t.author.name}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 999, background: sm.tint, color: sm.text, fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em', whiteSpace: 'nowrap' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.dot }} />{sm.label}</span>
            {t.status !== 'fechado' && t.assignee && rc && <span title={`Em atendimento por ${t.assignee.name}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 999, background: `${rc}1f`, color: rc, fontSize: 10.5, fontWeight: 700, letterSpacing: '.02em', whiteSpace: 'nowrap' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: rc }} />Atendendo · {t.assignee.name.split(' ')[0]}</span>}
            {t.status === 'fechado' && t.rating && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: 'var(--accent)' }}><Hearts n={t.rating} size={13} /> {t.ratingLabel}</span>}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Cliente · {timeAgo(t.createdAt)} · {t.msgCount} {t.msgCount === 1 ? 'mensagem' : 'mensagens'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasUnseen && (
            <span title={isNew ? 'Chamado novo — ainda não aberto' : `${t.unseen} ${t.unseen === 1 ? 'atualização não vista' : 'atualizações não vistas'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, background: hi, color: '#fff', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: `0 2px 8px ${hiSoft}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />{isNew ? 'Novo' : `${t.unseen} ${t.unseen === 1 ? 'nova' : 'novas'}`}
            </span>
          )}
          <span style={ticketNumChip} title={`Chamado nº ${t.number}`}>#{t.number}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--fg2)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: colorOf(t.category) }} />{t.category}</span>
          {/* Excluir (só admin): o card é um <button>, então isto é um <span role=button> com stopPropagation p/ não abrir o chamado. */}
          {me.isAdmin && (
            <span role="button" tabIndex={0} title="Excluir este chamado (admin)"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteTicket(t.id, t.number, t.subject); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); deleteTicket(t.id, t.number, t.subject); } }}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface2)', color: '#e0457a', cursor: 'pointer', flexShrink: 0 }}>
              <IconX size={15} sw={2.4} />
            </span>
          )}
        </div>
      </div>
      <div className="font-grotesk" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.25, margin: '0 0 8px' }}>{t.subject}</div>
      <p style={{ margin: '0 0 16px', color: 'var(--fg2)', fontSize: 14.5, lineHeight: 1.6 }}>{t.lastPreview}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 13.5, color: 'var(--fg2)' }}><IconComment size={18} />{t.msgCount} {t.msgCount === 1 ? 'mensagem' : 'mensagens'}</span>
        <div style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif" }}>Ver conversa<IconArrowRight size={15} sw={2.4} /></span>
      </div>
    </button>
  );
}
