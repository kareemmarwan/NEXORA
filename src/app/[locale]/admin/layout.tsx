import { setRequestLocale } from 'next-intl/server';
import { requireAdmin } from '@/lib/auth/session';
import { AdminSidebarNav } from '@/components/admin/sidebar-nav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  await requireAdmin(params.locale);

  return (
    <div className="container flex flex-col gap-8 py-10 lg:flex-row">
      <aside className="lg:w-60 lg:shrink-0">
        <div className="lg:sticky lg:top-20">
          <AdminSidebarNav />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
