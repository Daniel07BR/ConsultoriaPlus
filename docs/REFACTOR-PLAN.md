# Plano de refatoração — Consultoria Plus (monólito → modular + rotas)

> Documento de execução. Cada fase é **independente, deployável e reversível**.
> Faça **uma fase por sessão**, com build + deploy + teste do usuário entre elas.
> O sistema está **em produção** (.68, systemd `consultoria-plus`). Nunca big-bang.

## Por que

Hoje **todo o front-end vive em um único arquivo**: `src/components/AppClient.tsx`
(~1.900 linhas) — 50 `useState`, 6 `useEffect`, ~40 handlers e **12 telas** como
funções internas (closures sobre o estado do componente). Origem: o sistema nasceu
de um protótipo HTML estático e foi portado "fiel ao protótipo" como uma SPA num
componente só. Funciona, mas não escala: sem code-splitting (tudo carrega junto) e
um arquivo desse tamanho é ruim de manter.

A sincronização de URL já existe (pushState/popstate em AppClient) — F5/voltar/
deep-link funcionam. O que falta é **estrutura**.

## Estado atual (mapa do arquivo)

- **Topo de módulo (1–170):** `attIcon`, `LikesHoverButton`, `Hearts` (componentes
  puros); `type View`/`Acting`; interfaces (`Me`, `CategoryT`, `Attachment`,
  `StudyCard`, `ViewsPayload`, `CommentT`, `StudyDetailT`, `TicketCard`,
  `ReadReceiptT`, `MessageT`, `TicketRefT`, `AuditItemT`, `TicketDetailT`, `NotifT`,
  `VideoT`); consts (`chipBase`, `PAGE_NOTIF`, `VIEW_SLUG`/`SLUG_VIEW`/`urlForView`/
  `parseUrl`, `ticketSig`).
- **Componente `AppClient` (~172–1884):** todo o estado, efeitos (polling, url-sync,
  reload por filtro), handlers e as telas internas: `Linkify`, `FeedView`,
  `StudyCardEl`, `VideosView`, `StudyView`, `ComposeView`, `tCard`, `TicketsView`,
  `TicketView`, `NewTicketView`, `NotifIcon`, `NotificationsView`, `ProfileView`.
  Modais (views/auditoria/recibos/embed/categorias/vídeo) ficam inline no JSX.
- **Rodapé de módulo (1886–1896):** `labelStyle`, `inputStyle`, `attachPill`,
  `miniBtn`, `dateInput`, `pillX`, `ticketNumChip`, `Field`.

## Princípios

1. Cada fase **compila, builda e roda** sozinha; deploy ao fim de cada uma.
2. **Sem mudança de comportamento** nas fases 0–2 (refactor puro). Validar visual.
3. Um PR/commit por fase (ou por tela, na fase 2). Fácil de reverter.
4. Sem mexer em API/Prisma — é só front-end.

---

## Fase 0 — Extrair o "fácil" (risco mínimo, sem lógica)

Mover o que **não depende do estado do componente** para arquivos próprios e importar.

- `src/lib/types.ts` ← todas as `interface`/`type` inline (View, Me, StudyCard,
  TicketDetailT, MessageT, …). AppClient passa a importar.
- `src/lib/url.ts` ← `VIEW_SLUG`, `SLUG_VIEW`, `urlForView`, `parseUrl`.
- `src/lib/ticketSig.ts` (ou em `present.ts`) ← `ticketSig`.
- `src/components/ui/formKit.tsx` ← `labelStyle`, `inputStyle`, `attachPill`,
  `miniBtn`, `dateInput`, `pillX`, `ticketNumChip`, `chipBase`, `Field`.
- `src/components/ui/` ← `LikesHoverButton.tsx`, `Hearts.tsx`, `attIcon` (em
  `icons.tsx` ou `ui/attIcon.tsx`).

**Saída:** AppClient encolhe ~250 linhas só com imports; zero risco. Build + deploy.

---

## Fase 1 — `AppProvider` + `useApp()` (a peça-chave)

Criar `src/components/AppProvider.tsx` com um Context que carrega **todo o estado
compartilhado** hoje no AppClient: `me`, `theme`, `acting`, `view`, navegação
(`go`, `openTicket`, `openStudy`, `goFeed`…), `flashMsg`, `refreshMe`, contadores,
categorias, dados (studies/tickets/notifications/videos) e os loaders. Inclui os
`useEffect` de polling, url-sync e reload-por-filtro.

`AppClient` vira um **casca fina**: `<AppProvider>` + layout (sidebar/topnav) +
o switch de telas. As telas passam a ler `useApp()` em vez de closures.

- **Risco: médio.** É onde mora a maior parte do estado. Fazer numa fase só,
  validando: login, troca de visão (cliente/consultor), tema, polling ao vivo,
  recibos, auditoria, paginação de notificações, deep-link/F5.
- Mantém **exatamente** o comportamento atual.

---

## Fase 2 — Extrair as telas, uma por commit (risco baixo, repetível)

Mover cada tela interna para `src/components/views/<Tela>.tsx` consumindo `useApp()`:
`FeedView`, `StudyView`, `ComposeView`, `VideosView`, `TicketsView`, `TicketView`,
`NewTicketView`, `NotificationsView`, `ProfileView` (+ subcomponentes `StudyCardEl`,
`tCard`, `Linkify`, `NotifIcon`). Modais para `src/components/modals/`.

- **Uma tela por commit/deploy.** Após cada uma, o app é idêntico — fácil de validar
  e reverter. O monólito derrete arquivo a arquivo. Aqui é onde o tamanho do
  AppClient cai de ~1.900 para algumas centenas de linhas.

---

## Fase 3 — Rotas reais do Next.js (a estrutura "correta" + code-splitting)

Introduzir App Router de verdade:
- `app/(app)/layout.tsx` → casca (sidebar/topnav) + `<AppProvider>` (estado
  compartilhado entre rotas).
- Segmentos: `app/(app)/feed`, `/chamados`, `/chamados/[id]`, `/estudos/[id]`,
  `/videos`, `/notificacoes`, `/perfil`, `/publicar`, `/salvos`.
- Trocar a navegação por estado (`setView` + pushState manual) por **navegação de
  rota** (`useRouter`, `<Link>`, `usePathname`). Isso **substitui** o url-sync manual
  de hoje e dá **code-splitting real** (cada rota carrega só o seu JS).

- **Risco: o mais alto** (fronteiras server/client, middleware/SSO, `/sso` e o guard
  em `middleware.ts`). Fazer **por último**, com a base modular (fases 0–2) já estável.
- Cuidados: o `/sso` (cookie) e o `middleware.ts` precisam continuar liberando as
  novas rotas; o `APP_URL`/cookies não mudam. Validar SSO a partir do Nexus.

---

## Ordem recomendada de entrega

`Fase 0` → (deploy/validar) → `Fase 1` → (deploy/validar) → `Fase 2` tela a tela →
(deploy/validar) → `Fase 3` (opcional, quando quiser o ganho de code-splitting).

**Fases 0–2 já resolvem "não é mais um arquivo gigante".** A Fase 3 é o passo extra
para a estrutura canônica de Next.js + carregamento sob demanda.

## Fluxo de deploy (lembrete)

Editar localmente → `rsync` p/ `~/consultoria-plus` no .68 (chave
`~/.ssh/consultoria_deploy`) → `npm run build` → `sudo systemctl restart
consultoria-plus` → branch/commit/merge em `main` → `git push origin main` (vai p/ os
dois remotes). Sem migrations nesta refatoração (só front-end).
