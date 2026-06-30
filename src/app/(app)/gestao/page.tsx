// Feed de Gestão — restrito à liderança (consultoria/diretoria/admin + Gestor/Sub-encarregado).
// Guard server-side (middleware é edge e não lê o banco). Reusa a FeedView (feed-aware).
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { FeedView } from '@/components/views/FeedView';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  if (!me.canGestao) redirect('/sem-acesso');
  return <FeedView />;
}
