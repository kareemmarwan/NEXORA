import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  LayoutDashboard,
  Package,
  Layers,
  CreditCard,
  Users,
  Tag,
} from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { Link } from '@/i18n/navigation';

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
  const t = await getTranslations('admin');

  const nav = [
    { href: '/admin', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/admin/orders', label: t('orders'), icon: Package },
    { href: '/admin/services', label: t('services'), icon: Layers },
    { href: '/admin/categories', label: t('categories'), icon: Tag },
    { href: '/admin/payment-methods', label: t('paymentMethods'), icon: CreditCard },
    { href: '/admin/customers', label: t('customers'), icon: Users },
  ];

  return (
    <div className="container flex flex-col gap-8 py-10 lg:flex-row">
      <aside className="lg:w-60 lg:shrink-0">
        <nav aria-label={t('title')} className="flex flex-row flex-wrap gap-2 lg:flex-col">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href as '/admin'}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
