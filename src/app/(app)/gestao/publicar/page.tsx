// Publicar/editar no Feed de Gestão. Mesmo guard + reusa a ComposeView (feed-aware).
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ComposeView } from '@/components/views/ComposeView';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  if (!me.canGestao) redirect('/sem-acesso');
  return <ComposeView />;
}
