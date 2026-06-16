// Seed de DESENVOLVIMENTO. Carrega o diretório real do Nexus (exportado para
// /tmp/nexus-users.json) como AppUsers e popula os estudos/chamados do protótipo
// como dados reais. NÃO usar em produção (lá os usuários vêm do sync via API).
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';

const prisma = new PrismaClient();

const DUAL = ['diretoria'];
const CONSULTOR = ['consultoria'];
const ADMIN_CARGOS = ['administrador'];
function deriveBaseRole(dep, cargo) {
  const d = (dep || '').trim().toLowerCase();
  const c = (cargo || '').trim().toLowerCase();
  if (c && ADMIN_CARGOS.includes(c)) return 'both';
  if (DUAL.includes(d)) return 'both';
  if (CONSULTOR.includes(d)) return 'consultor';
  return 'cliente';
}

const USERS = JSON.parse(readFileSync('/tmp/nexus-users.json', 'utf8'));

async function seedUsers() {
  let created = 0;
  for (const u of USERS) {
    const data = {
      username: u.username ?? null,
      name: u.name,
      email: u.email ?? null,
      phone: u.phone ?? null,
      cargo: u.role ?? null,
      department: u.department ?? null,
      nexusDeptId: u.departmentId ?? null,
      avatar: u.avatar ?? null,
      status: u.status ?? 'active',
      hireDate: u.hireDate ? new Date(u.hireDate) : null,
      baseRole: deriveBaseRole(u.department, u.role),
    };
    await prisma.appUser.upsert({
      where: { nexusUserId: u.employeeId },
      create: { nexusUserId: u.employeeId, ...data },
      update: data,
    });
    created++;
  }
  console.log(`AppUsers upsert: ${created}`);
}

// Estudos/chamados do protótipo (Consultoria Plus.dc.html)
const STUDIES = [
  {
    category: 'Tributário', readTime: '6 min', daysAgo: 0,
    title: 'Reforma Tributária: como o Split Payment muda o seu fluxo de caixa',
    body: [
      'A reforma tributária introduz o mecanismo de Split Payment, em que o imposto é recolhido automaticamente no momento da liquidação financeira da operação. Na prática, parte do valor pago pelo cliente vai direto para o fisco, sem transitar pelo caixa da empresa.',
      'Para se preparar, recomendamos revisar os fluxos de recebimento, conciliar os meios de pagamento com o ERP e simular o impacto no capital de giro ainda neste semestre. Empresas que anteciparem os ajustes terão muito menos atrito na virada de 2026.',
    ],
    attachments: [
      { kind: 'file', name: 'Guia_Split_Payment_2026.pdf', meta: 'PDF · 2,4 MB' },
      { kind: 'link', name: 'Portal da Reforma Tributária', meta: 'gov.br/reforma-tributaria', url: 'https://www.gov.br/reforma-tributaria' },
    ],
    likes: 42,
    comments: [
      { who: 'cliente', q: false, text: 'Excelente resumo! Já começamos a mapear nossos meios de pagamento por aqui.' },
      { who: 'cliente', q: true, text: 'O Split Payment vale também para vendas parceladas no cartão? Como fica o recolhimento nesse caso?' },
      { who: 'consultor', q: false, text: 'Ótima pergunta! Sim, vale — o recolhimento ocorre proporcionalmente a cada parcela liquidada. Vou detalhar isso num próximo estudo.' },
    ],
  },
  {
    category: 'Fiscal', readTime: '4 min', daysAgo: 0,
    title: 'Os 5 créditos de PIS/COFINS que as empresas mais esquecem',
    body: [
      'No regime não-cumulativo de PIS/COFINS, muitas empresas deixam de aproveitar créditos legítimos por falta de mapeamento. Os cinco mais esquecidos são: energia elétrica de estabelecimento, fretes na operação de venda, embalagens, depreciação de máquinas e despesas com armazenagem.',
      'Recomendamos uma revisão dos últimos 5 anos — o crédito não aproveitado pode ser recuperado de forma administrativa, gerando caixa relevante sem litígio.',
    ],
    attachments: [
      { kind: 'link', name: 'Instrução Normativa RFB 2.121/2022', meta: 'in.normas.receita.fazenda.gov.br', url: 'https://in.normas.receita.fazenda.gov.br' },
    ],
    likes: 28,
    comments: [
      { who: 'cliente', q: false, text: 'Não sabia que frete de venda gerava crédito. Vamos revisar aqui!' },
    ],
  },
  {
    category: 'Societário', readTime: '5 min', daysAgo: 1,
    title: 'Pró-labore ou distribuição de lucros? O equilíbrio que reduz a carga tributária',
    body: [
      'A escolha entre pró-labore e distribuição de lucros impacta diretamente a carga tributária dos sócios. O pró-labore sofre INSS e IRRF, enquanto a distribuição de lucros é isenta — desde que haja lucro contábil apurado e escrituração regular.',
      'O equilíbrio ideal considera o teto do INSS, a necessidade de comprovação de renda e o regime tributário da empresa. Para a maioria das PMEs, um pró-labore próximo ao mínimo necessário combinado com distribuição é o cenário mais eficiente.',
    ],
    attachments: [],
    likes: 35,
    comments: [
      { who: 'cliente', q: true, text: 'Tem como fazer essa simulação considerando dois sócios com participações diferentes?' },
    ],
  },
  {
    category: 'Contábil', readTime: '3 min', daysAgo: 2,
    title: 'Checklist de fechamento contábil mensal: as 12 etapas essenciais',
    body: [
      'Um fechamento contábil bem estruturado evita retrabalho e surpresas na hora da apuração de impostos. Preparamos um checklist com as 12 etapas essenciais, da conciliação bancária ao fechamento de estoques.',
      'Baixe a planilha anexa e adapte ao seu calendário. O ideal é concluir o fechamento até o 5º dia útil do mês seguinte.',
    ],
    attachments: [
      { kind: 'file', name: 'Checklist_Fechamento_Mensal.xlsx', meta: 'Planilha · 318 KB' },
    ],
    likes: 51,
    comments: [],
  },
  {
    category: 'Folha de Pagamento', readTime: '4 min', daysAgo: 3,
    title: 'eSocial: novas regras para eventos periódicos a partir de julho',
    body: [
      'A partir de julho, o eSocial passa a exigir o envio de eventos periódicos em novo layout. As principais mudanças afetam os eventos S-1200 e S-1210, com validações mais rígidas sobre rubricas e bases de cálculo.',
      'Atualize o software de folha e faça um envio-teste no ambiente de homologação antes do prazo oficial para evitar rejeições.',
    ],
    attachments: [],
    likes: 19,
    comments: [],
  },
];

const TICKETS = [
  {
    subject: 'Crédito de ICMS em compras interestaduais — posso aproveitar?',
    category: 'Tributário', status: 'andamento', hoursAgo: 3,
    messages: [
      { who: 'cliente', text: 'Compramos insumos de um fornecedor em SP e a NF veio com ICMS destacado. Posso me creditar integralmente desse valor estando no Lucro Real?' },
      { who: 'consultor', text: 'Oi! Em regra sim, desde que os insumos sejam usados na atividade-fim e a NF esteja válida. Vou conferir a CFOP utilizada e te retorno com o detalhamento do cálculo do crédito.' },
    ],
  },
  {
    subject: 'Erro na transmissão do SPED Fiscal de maio',
    category: 'Fiscal', status: 'respondido', hoursAgo: 26,
    messages: [
      { who: 'cliente', text: 'A transmissão do SPED Fiscal de maio está retornando erro de registro C170. Conseguem ajudar?' },
      { who: 'consultor', text: 'Olá! O erro no C170 costuma ser divergência de unidade de medida entre a NF e o cadastro do produto. Corrija a unidade no item e retransmita — deve passar na validação.' },
      { who: 'cliente', text: 'Funcionou! Transmitido com sucesso. Muito obrigada 🙏' },
    ],
  },
  {
    subject: 'Despesas com home office são dedutíveis no Lucro Real?',
    category: 'Societário', status: 'aberto', minutesAgo: 20,
    messages: [
      { who: 'cliente', text: 'Parte da equipe trabalha em home office e reembolsamos internet e energia. Essas despesas são dedutíveis na apuração do Lucro Real?' },
    ],
  },
];

function ago({ daysAgo, hoursAgo, minutesAgo }) {
  const d = new Date();
  if (daysAgo) d.setDate(d.getDate() - daysAgo);
  if (hoursAgo) d.setHours(d.getHours() - hoursAgo);
  if (minutesAgo) d.setMinutes(d.getMinutes() - minutesAgo);
  return d;
}

async function seedContent() {
  const existing = await prisma.study.count();
  if (existing > 0) {
    console.log('Estudos já existem — pulando conteúdo.');
    return;
  }
  const consultores = await prisma.appUser.findMany({
    where: { baseRole: { in: ['consultor', 'both'] } }, select: { id: true, name: true },
  });
  const clientes = await prisma.appUser.findMany({
    where: { baseRole: 'cliente', status: 'active' }, take: 6, select: { id: true, name: true },
  });
  if (!consultores.length || !clientes.length) {
    console.log('Faltam consultores/clientes para seed de conteúdo.');
    return;
  }
  const consultor = consultores[0];
  const pick = (arr, i) => arr[i % arr.length];

  for (let i = 0; i < STUDIES.length; i++) {
    const s = STUDIES[i];
    const created = ago({ daysAgo: s.daysAgo });
    const study = await prisma.study.create({
      data: {
        authorId: pick(consultores, i).id,
        category: s.category,
        title: s.title,
        body: s.body.join('\n\n'),
        readTime: s.readTime,
        createdAt: created,
        attachments: { create: s.attachments.map((a) => ({ kind: a.kind, name: a.name, meta: a.meta, url: a.url ?? null })) },
        comments: {
          create: s.comments.map((c, j) => ({
            authorId: c.who === 'consultor' ? consultor.id : pick(clientes, i + j).id,
            role: c.who,
            text: c.text,
            isQuestion: c.q,
            createdAt: new Date(created.getTime() + (j + 1) * 60000),
          })),
        },
      },
    });
    // curtidas fictícias: distribui entre clientes
    const likers = clientes.slice(0, Math.min(s.likes, clientes.length));
    for (const l of likers) {
      await prisma.studyLike.create({ data: { studyId: study.id, userId: l.id } });
    }
  }
  console.log(`Estudos criados: ${STUDIES.length}`);

  for (const t of TICKETS) {
    const created = ago(t);
    const requester = pick(clientes, TICKETS.indexOf(t));
    await prisma.ticket.create({
      data: {
        requesterId: requester.id,
        subject: t.subject,
        category: t.category,
        status: t.status,
        createdAt: created,
        messages: {
          create: t.messages.map((m, j) => ({
            authorId: m.who === 'consultor' ? consultor.id : requester.id,
            role: m.who,
            text: m.text,
            createdAt: new Date(created.getTime() + j * 3600000),
          })),
        },
      },
    });
  }
  console.log(`Chamados criados: ${TICKETS.length}`);
}

await seedUsers();
await seedContent();
await prisma.$disconnect();
console.log('Seed de dev concluído.');
