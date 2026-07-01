import type { TicketDetailT } from './types';

// Assinatura do chamado p/ o polling: muda se título, citação, status, responsável
// (assumir/liberar) ou qualquer mensagem (texto/edição/exclusão) mudar — não só a
// quantidade de mensagens. Assim, quando outra consultora assume, a tela reflete.
export function ticketSig(t: TicketDetailT): string {
  return JSON.stringify({
    s: t.subject, r: t.reference?.id ?? null, st: t.status, a: t.assignee?.id ?? null,
    m: t.messages.map((m) => [m.id, m.text, m.edited, m.deleted, m.deletedReason, m.reads.length]),
  });
}
