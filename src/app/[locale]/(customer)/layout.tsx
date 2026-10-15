import { requireUser } from '@/lib/auth/session';
import { setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  await requireUser(params.locale);
  return <>{children}</>;
}
