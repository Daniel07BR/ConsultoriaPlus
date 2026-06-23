// Layout do app autenticado (Fase 3): monta o estado compartilhado (AppProvider)
// e a casca (AppShell) uma vez; cada rota-filha entra como children. Auth garantida
// pelo middleware; checagem server-side aqui como rede de segurança.
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AppProvider } from '@/components/AppProvider';
import { AppShell } from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
