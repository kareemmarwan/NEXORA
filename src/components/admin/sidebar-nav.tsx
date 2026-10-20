'use client';

import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  CreditCard,
  Users,
  FileText,
  Newspaper,
  BookOpen,
  ImageIcon,
  type LucideIcon,
} from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

export function AdminSidebarNav() {
  const t = useTranslations('admin');
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      items: [{ href: '/admin', label: t('dashboard'), icon: LayoutDashboard, exact: true }],
    },
    {
      label: t('groupStore'),
      items: [
        { href: '/admin/orders', label: t('orders'), icon: Package },
        { href: '/admin/services', label: t('services'), icon: Layers },
        { href: '/admin/categories', label: t('categories'), icon: Tag },
        { href: '/admin/payment-methods', label: t('paymentMethods'), icon: CreditCard },
      ],
    },
    {
      label: t('groupContent'),
      items: [
        { href: '/admin/blog', label: t('blog'), icon: Newspaper },
        { href: '/admin/docs', label: t('docs'), icon: BookOpen },
        { href: '/admin/content', label: t('content'), icon: FileText },
        { href: '/admin/media', label: t('mediaNav'), icon: ImageIcon },
      ],
    },
    {
      label: t('groupUsers'),
      items: [{ href: '/admin/customers', label: t('customers.title'), icon: Users }],
    },
  ];

  return (
    <nav aria-label={t('title')} className="flex flex-row flex-wrap gap-4 lg:flex-col lg:gap-5">
      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-1">
          {group.label && (
            <p className="px-4 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as '/admin'}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'border-primary/30 bg-primary/10 text-primary shadow-glow-sm'
                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
