// Tipos compartilhados do front-end (extraídos de AppClient na Fase 0 do refactor).
// São tipos puros de dados — sem dependência de React ou de estado.

export type View = 'feed' | 'saved' | 'study' | 'compose' | 'tickets' | 'ticket' | 'newticket' | 'notifications' | 'profile' | 'videos' | 'gestao' | 'gestaoStudy' | 'gestaoCompose';
export type Acting = 'cliente' | 'consultor';

export interface Me {
  user: { id: string; name: string; cargo: string | null; department: string | null; avatar: string | null };
  role: 'cliente' | 'consultor' | 'both';
  canConsultor: boolean;
  canSwitch: boolean;
  canGestao: boolean;
  isAdmin: boolean; // admin do sistema (cargo Administrador) — pode excluir chamados
  defaultView: Acting;
  counts: { openTickets: number; unseenTickets: number; saved: number; unread: number; openQEstudos: number; openQGestao: number };
  categories: CategoryT[];
}
export interface CategoryT { id: string; name: string; color: string }
export interface Attachment { kind: string; name: string; meta: string | null; url: string | null }
export interface StudyCard {
  id: string; feed: string; title: string; category: string; excerpt: string; coverImage: string | null; readTime: string | null; createdAt: string;
  author: { name: string; title: string | null; avatar: string | null; department: string | null };
  likes: number; liked: boolean; saved: boolean; commentCount: number; attachments: Attachment[];
  views: number; viewed: boolean; openQuestion: boolean;
}
export interface ViewsPayload {
  total: number;
  viewedByMe: boolean;
  departments: { department: string; users: { name: string; avatar: string | null; cargo: string | null; viewedAt: string }[] }[];
}
export interface CommentT { id: string; author: { name: string; avatar: string | null; department: string | null }; role: string; text: string; isQuestion: boolean; mine: boolean; createdAt: string }
export interface StudyDetailT extends Omit<StudyCard, 'excerpt'> { mine: boolean; body: string[]; comments: CommentT[] }
export interface TicketCard {
  id: string; number: number; subject: string; category: string; status: string; rating: number | null; ratingLabel: string | null; createdAt: string;
  author: { name: string; avatar: string | null; department: string | null };
  responder: { name: string; avatar: string | null } | null; // consultor que está respondendo
  assignee: { name: string; avatar: string | null } | null; // consultor que assumiu o chamado
  msgCount: number; lastPreview: string; unseen: number;
}
export interface ReadReceiptT { name: string; avatar: string | null; role: string; readAt: string }
export interface MessageT {
  id: string; author: { name: string; avatar: string | null; department: string | null }; role: string; text: string; mine: boolean; createdAt: string;
  edited: boolean; deleted: boolean; deletedReason: string | null; deletedByName: string | null; deletedAt: string | null;
  reads: ReadReceiptT[];
}
export interface TicketRefT { id: string; number: number; subject: string; status: string; createdAt: string; author: { name: string; avatar: string | null } }
export interface AuditItemT { id: string; action: string; previousText: string; newText: string | null; reason: string | null; editorName: string; editorRole: string; messageAuthor: string | null; messageRole: string | null; createdAt: string }
export interface TicketDetailT {
  id: string; number: number; subject: string; category: string; status: string; createdAt: string;
  rating: number | null; ratingLabel: string | null; closedAt: string | null;
  reference: { id: string; number: number; subject: string } | null;
  canReply: boolean; canClose: boolean; canEdit: boolean; auditCount: number;
  assignee: { id: string; name: string; avatar: string | null } | null; // consultor que assumiu
  canAssign: boolean; assignedToMe: boolean;
  author: { name: string; avatar: string | null; department: string | null }; messages: MessageT[];
}
export interface NotifT { id: string; kind: string; title: string; body: string; targetType: string | null; targetId: string | null; commentId: string | null; read: boolean; createdAt: string }
export interface OpenQuestionT { commentId: string; studyId: string; feed: string; studyTitle: string; author: { name: string; avatar: string | null }; text: string; createdAt: string }
export interface VideoT { id: string; title: string; description: string | null; url: string; youtubeId: string | null; thumbUrl: string | null; tab: string; source: string; courseTitle: string | null; sourceUrl: string | null; watched: boolean; author: { name: string; avatar: string | null } | null; createdAt: string }
