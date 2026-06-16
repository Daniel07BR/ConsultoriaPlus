import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AppClient from '@/components/AppClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  return <AppClient />;
}
