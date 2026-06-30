// Detalhe de uma publicação do Feed de Gestão. Mesmo guard + reusa a StudyView.
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { StudyView } from '@/components/views/StudyView';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  if (!me.canGestao) redirect('/sem-acesso');
  return <StudyView />;
}
