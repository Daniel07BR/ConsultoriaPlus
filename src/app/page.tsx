import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Landing pós-SSO/login: manda para a tela inicial (feed) em rota real.
export default async function Home() {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  redirect('/feed');
}
