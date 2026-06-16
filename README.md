# Consultoria Plus

Rede social interna da consultoria contábil do **Grupo Itamarathy**. Reúne, num
único lugar, dois fluxos do dia-a-dia da equipe:

- **Feed de estudos** — consultores publicam matérias por categoria
  (Tributário, Fiscal, Societário, Folha de Pagamento, Contábil) com imagem de
  capa, anexos de Drive, links e vídeos. Os clientes curtem, salvam, comentam
  e fazem perguntas; perguntas são respondidas pelos consultores e quem
  perguntou recebe notificação.
- **Chamados (suporte)** — o cliente abre um chamado por categoria, troca
  mensagens com o consultor responsável, e ao fechar avalia o atendimento de 1
  a 5 (com selo de "Solucionado / Muito bom / Ajudou / Resolveu pouco / Não
  resolvido"). Histórico fica visível pra todos.

Também há uma página de **Vídeos** (treinamentos e sugestões) que espelha em
tempo quase-real os vídeos da categoria *Consultoria* do **Itamarathy
ClassRoom** — vídeos novos viram comunicado/alerta automático no Nexus.

## Quem usa, e em qual papel

Identidade e acesso vêm do **Nexus** (hub de gestão de funcionários do grupo)
por SSO — usuário comum nunca cria senha aqui. Ao logar pela primeira vez, o
usuário é espelhado por `nexus_user_id` (UUID estável), com foto e
departamento. O papel é derivado:

| Departamento no Nexus | Papel no Consultoria Plus |
|---|---|
| Diretoria | Consultor **e** cliente (alterna a visão) |
| Consultoria | Consultor |
| Demais | Cliente |

Admins podem sobrescrever o papel individualmente (`role_override`). Quem
perde a liberação no Nexus deixa de aparecer no diretório local
automaticamente, sem deleção (preserva integridade dos registros locais).

## O que tem dentro

- **Estudos** com capa, anexos (links de YouTube, Drive, site), categorias
  gerenciáveis, curtidas, salvos, comentários e perguntas.
- **Joinha "vi este estudo"** — clique no joinha marca visualização; abre um
  modal animado com a lista de quem viu agrupado por departamento. A
  visualização também é setada automaticamente quando o usuário dá ciência no
  comunicado correspondente no Nexus (via webhook genérico de ack).
- **Chamados** com status (`aberto`, `andamento`, `respondido`, `fechado`),
  mensagens em thread, avaliação ao fechar.
- **Notificações in-app** — pergunta de cliente notifica a equipe de
  consultores; resposta de consultor notifica quem comentou; chamado novo
  notifica a equipe; fechamento de chamado avisa quem é parte.
- **Vídeos** com integração ClassRoom (espelho fiel) + cadastro local.
- **Atualização em tempo real** — sem F5: a interface pulla com intervalos
  contextuais (sino/contadores a cada 10s, feed a cada 20s, estudo/chamado
  aberto a cada 8s) e pausa quando a aba está oculta.

## Integração com o Nexus

- **SSO** — `/sso?nexus_ticket=…` troca o ticket no backend Nexus por
  identidade + autorização. Sem `ticket` → login local (não redireciona pro
  Nexus, evita loops).
- **Sincronização de diretório** — `GET /api/integrations/users` no Nexus
  traz apenas funcionários liberados pra este sistema, com avatar; upsert
  local por `nexus_user_id`.
- **Push de estudos** — ao publicar um estudo, dispara
  `PUT /api/integrations/announcements` no Nexus criando um comunicado do
  tipo `consultoria-plus` para todos os AppUsers ativos. O comunicado entra
  no sino, na página `/comunicados` (aba "Consultoria Plus") e no modal de
  leitura obrigatória do portal.
- **Webhook de ack** — quando o usuário dá ciência no Nexus, este sistema
  recebe `POST /api/nexus/ack-webhook` e marca o joinha como visto
  localmente. Idempotente, autenticado por header `X-Nexus-Webhook`.

## Stack

- **Next.js 15** (App Router) + React 19, TypeScript estrito.
- **Prisma 6** + **PostgreSQL** (cluster próprio do usuário `suporte`).
- **NextAuth-like** session cookie próprio assinado com `SESSION_SECRET`
  (`jose` para JWT).
- **Sharp** para otimizar imagem de capa (webp) e avatares.
- **Sem framework de UI** — componentes próprios em CSS-in-JS e ícones SVG
  inline (`Space Grotesk` para títulos, Inter para texto).

## Estrutura

```
src/
├── app/
│   ├── api/                # rotas server-side (Next.js handlers)
│   │   ├── studies/        # CRUD de estudos, comentários, curtidas, salvos, visualizações
│   │   ├── tickets/        # CRUD de chamados, mensagens, fechamento
│   │   ├── videos/         # vídeos + sync com ClassRoom
│   │   ├── notifications/  # notificações in-app
│   │   ├── categories/     # categorias gerenciáveis
│   │   ├── sync/           # sincronização de usuários/departamentos com Nexus
│   │   ├── integrations/   # webhooks de entrada (ex.: ClassRoom)
│   │   └── nexus/
│   │       └── ack-webhook # recebe ack de comunicado do Nexus
│   ├── sso/                # endpoint de entrada SSO (troca ticket → sessão)
│   ├── login/              # login local (admin)
│   └── page.tsx            # SPA-like, renderiza AppClient
├── components/
│   ├── AppClient.tsx       # interface principal (feed, chamados, vídeos, perfil)
│   ├── Avatar.tsx
│   ├── CategoryManager.tsx
│   ├── VideoForm.tsx
│   └── icons.tsx
└── lib/
    ├── auth.ts             # sessão + role efetivo
    ├── db.ts               # cliente Prisma
    ├── nexus.ts            # cliente server-to-server do Nexus
    ├── classroom.ts        # cliente do ClassRoom
    ├── notify.ts           # criação de notificações in-app
    ├── notify-nexus.ts     # push de estudos para o Nexus
    ├── queries.ts          # queries de listagem/detalhe
    ├── roles.ts            # papel base e overrides
    ├── session.ts          # cookie JWT
    └── sync.ts             # sincronização de diretório
```

## Variáveis de ambiente

```
DATABASE_URL=postgresql://consultoria@127.0.0.1:5433/consultoria_plus?schema=public

# SSO + diretório Nexus
NEXUS_BASE_URL=http://<ip-nexus>:3001         # server-to-server
NEXUS_API_KEY=<gerada no cadastro do sistema>
NEXUS_SYSTEM_ID=<uuid do system no Nexus>
NEXUS_PORTAL_URL=https://nexus.grupoitamarathy.local/portal
APP_URL=https://consultoria.grupoitamarathy.local

# Sessão local
SESSION_SECRET=<segredo forte>

# Papéis automáticos por departamento
CONSULTOR_DEPARTMENTS=Consultoria
DUAL_VIEW_DEPARTMENTS=Diretoria
ADMIN_CARGOS=Administrador,Diretor

# Integração ClassRoom (vídeos + chamados a partir de aprovação de curso)
CLASSROOM_BASE_URL=https://classroom.grupoitamarathy.local
CLASSROOM_INTEGRATION_KEY=<key compartilhada com o ClassRoom>

# Operação
PORT=3000
DEV_LOGIN=<usuário admin local p/ bootstrap, opcional em dev>
```

## Rodando

```bash
npm install
npx prisma migrate deploy
npm run build
npm start
```

Em produção é gerenciado como serviço systemd (`consultoria-plus.service`),
atrás de Apache fazendo TLS em `https://consultoria.grupoitamarathy.local`
com certificado da CA interna **ITAMARATHY Root CA**.

## Autor

**Daniel Amorim** — Suporte / TI no Grupo Itamarathy. Desenvolvi este sistema
do zero em Next.js para substituir um protótipo HTML estático, com integração
nativa ao Nexus (SSO + diretório + comunicados) e ao ClassRoom (espelho de
vídeos). O foco é tirar fricção do dia-a-dia entre a equipe de consultoria
contábil e os demais setores do grupo, mantendo tudo numa única identidade e
sem senhas locais pro usuário comum.

Contato corporativo: `daniel.amorim` no domínio do grupo.

## Licença

Uso interno do Grupo Itamarathy. Todos os direitos reservados.
