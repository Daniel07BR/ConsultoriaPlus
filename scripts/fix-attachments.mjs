// Redetecta kind/name dos anexos existentes (dados criados antes da detecção de tipo).
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function youtubeId(u) { const m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/); return m ? m[1] : null; }
function driveId(u) { const m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/); return m ? m[1] : null; }
function kindOf(u) { if (youtubeId(u)) return 'video'; if (driveId(u)) return 'drive'; return 'link'; }
function labelOf(u) {
  if (youtubeId(u)) return 'Vídeo do YouTube';
  if (driveId(u)) return 'Arquivo do Google Drive';
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; }
}

const atts = await prisma.studyAttachment.findMany();
let fixed = 0;
for (const a of atts) {
  const url = a.url || a.name;
  if (!url) continue;
  const kind = kindOf(url);
  // só renomeia se o name atual for a URL crua (dado antigo)
  const name = /^https?:\/\//i.test(a.name) ? labelOf(url) : a.name;
  if (a.kind !== kind || a.name !== name || a.url !== url) {
    await prisma.studyAttachment.update({ where: { id: a.id }, data: { kind, name, url } });
    fixed++;
  }
}
console.log(`Anexos corrigidos: ${fixed}/${atts.length}`);
await prisma.$disconnect();
