// Backfill: leva comentários/perguntas ANTIGOS de publicações para o inbox de
// notificações, JÁ como lidos (read=true, sem badge/alerta) e com a data original
// do comentário (aparecem na posição cronológica certa, não como "agora").
// Espelha a lógica de destinatários do notifyOnComment. Idempotente: pula
// comentários que já têm notificação (commentId).
// Uso: node scripts/backfill-comment-notifications.mjs   (lê DATABASE_URL do ambiente)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function consultorIds(exclude) {
  const us = await prisma.appUser.findMany({
    where: { baseRole: { in: ['consultor', 'both'] }, status: { not: 'inactive' } },
    select: { id: true },
  });
  return us.map((u) => u.id).filter((id) => id !== exclude);
}

async function main() {
  const existing = await prisma.notification.findMany({
    where: { commentId: { not: null } },
    select: { commentId: true },
  });
  const done = new Set(existing.map((e) => e.commentId));

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      study: { select: { id: true, title: true, feed: true, authorId: true } },
      author: { select: { id: true, name: true } },
    },
  });

  let created = 0;
  let processed = 0;
  for (const c of comments) {
    if (done.has(c.id) || !c.study) continue;
    processed++;
    const feed = c.study.feed;
    const targetType = feed === 'gestao' ? 'gestaoStudy' : 'study';
    const base = { targetType, targetId: c.study.id, commentId: c.id, read: true, createdAt: c.createdAt };
    const rows = [];

    if (feed === 'gestao') {
      if (c.study.authorId !== c.authorId) {
        rows.push({ userId: c.study.authorId, kind: 'estudo', title: c.author.name, body: `comentou na sua publicação "${c.study.title}".`, ...base });
      }
    } else if (c.role === 'consultor') {
      const commenters = await prisma.comment.findMany({ where: { studyId: c.study.id, role: 'cliente' }, select: { authorId: true }, distinct: ['authorId'] });
      for (const uid of commenters.map((x) => x.authorId).filter((id) => id !== c.authorId)) {
        rows.push({ userId: uid, kind: 'resposta', title: c.author.name, body: `respondeu no estudo "${c.study.title}".`, ...base });
      }
    } else if (c.isQuestion) {
      for (const uid of await consultorIds(c.authorId)) {
        rows.push({ userId: uid, kind: 'pergunta', title: c.author.name, body: `fez uma pergunta no estudo "${c.study.title}".`, ...base });
      }
    } else {
      for (const uid of await consultorIds(c.authorId)) {
        rows.push({ userId: uid, kind: 'estudo', title: c.author.name, body: `comentou no estudo "${c.study.title}".`, ...base });
      }
    }

    if (rows.length) { await prisma.notification.createMany({ data: rows }); created += rows.length; }
  }

  console.log(JSON.stringify({ totalComments: comments.length, backfilled: processed, notificationsCreated: created }));
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); process.exit(1); });
