import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const me = await getCurrentUser();
  if (me) redirect('/');
  return (
    <LoginClient
      portalUrl={process.env.NEXUS_PORTAL_URL || '#'}
      devLogin={process.env.DEV_LOGIN === 'true'}
    />
  );
}
