// Seed idempotente das categorias iniciais. Roda em dev e prod.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CATS = [
  { name: 'Tributário', color: '#ff5c89', position: 0 },
  { name: 'Fiscal', color: '#e0457a', position: 1 },
  { name: 'Societário', color: '#fb8cac', position: 2 },
  { name: 'Folha de Pagamento', color: '#fda8bf', position: 3 },
  { name: 'Contábil', color: '#f06a98', position: 4 },
];

for (const c of CATS) {
  await prisma.category.upsert({
    where: { name: c.name },
    create: c,
    update: { color: c.color, position: c.position },
  });
}
const n = await prisma.category.count();
console.log(`Categorias: ${n}`);
await prisma.$disconnect();
