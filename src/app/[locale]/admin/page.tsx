import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Clock,
  Wrench,
  PackageCheck,
  DollarSign,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/orders/status-badges';
import { getDashboardStats } from '@/lib/data/admin';
import { pick } from '@/lib/utils/pick';
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils/format';
import type { SupportedLocale } from '@/lib/utils/format';

function RevenueChart({
  data,
}: {
  data: { day: string; revenue: number }[];
  locale: SupportedLocale;
}) {
  const width = 640;
  const height = 200;
  const padding = { top: 16, right: 16, bottom: 28, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const stepX = chartWidth / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartHeight - (d.revenue / max) * chartHeight,
    ...d,
  }));

  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${padding.left},${padding.top + chartHeight} ${line} ${padding.left + chartWidth},${padding.top + chartHeight}`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Revenue chart"
        className="h-52 w-full min-w-[520px]"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * (1 - ratio);
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="hsl(var(--border))"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="hsl(var(--muted-foreground))"
              >
                {Math.round(max * ratio)}
              </text>
            </g>
          );
        })}

        <polygon points={area} fill="hsl(var(--primary))" opacity="0.12" />
        <polyline
          points={line}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <g key={p.day}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="hsl(var(--primary))" />
            {i % 2 === 0 && (
              <text
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="9"
                fill="hsl(var(--muted-foreground))"
              >
                {p.day.slice(5)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default async function AdminDashboard({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const tc = await getTranslations('common');

  const stats = await getDashboardStats();
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  const cards = [
    {
      label: t('pendingReview'),
      value: String(stats.pendingReview),
      icon: Clock,
      color: 'text-warning',
      href: '/admin/orders?status=payment_review',
    },
    {
      label: t('inProgress'),
      value: String(stats.inProgress),
      icon: Wrench,
      color: 'text-primary',
      href: '/admin/orders?status=in_progress',
    },
    {
      label: t('deliveredThisMonth'),
      value: String(stats.deliveredThisMonth),
      icon: PackageCheck,
      color: 'text-success',
      href: '/admin/orders?status=delivered',
    },
    {
      label: t('revenueThisMonth'),
      value: formatPrice(stats.revenueThisMonth, locale),
      icon: DollarSign,
      color: 'text-accent',
      href: '/admin/orders',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href as '/admin'}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center gap-4 p-5">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-muted ${color}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('revenueByDay')}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.revenueByDay.some((d) => d.revenue > 0) ? (
            <RevenueChart data={stats.revenueByDay} locale={locale} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('chart.noData')}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders by status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('ordersByStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.ordersByStatus.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t('noOrders')}</p>
            ) : (
              stats.ordersByStatus.map(({ status, count }) => {
                const total = stats.ordersByStatus.reduce((s, x) => s + x.count, 0);
                return (
                  <Link key={status} href={`/admin/orders?status=${status}`} className="group block">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <OrderStatusBadge status={status} />
                      <span className="font-semibold text-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#4338ca] transition-all"
                        style={{ width: `${total > 0 ? Math.max(6, (count / total) * 100) : 0}%` }}
                      />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Top services */}
        <Card>
          <CardHeader>
            <CardTitle>{t('topServices')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.topServices.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t('noOrders')}</p>
            ) : (
              stats.topServices.map((service, index) => (
                <div key={`${service.titleAr}-${service.titleEn}`} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {pick(service, 'title', locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('soldCount', { count: service.count })}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatPrice(service.revenue, locale)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent events */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recentEvents')}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t('noEvents')}</p>
            ) : (
              <ol className="relative flex flex-col gap-4 border-s border-border ps-4">
                {stats.recentEvents.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -start-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm text-foreground">
                      {event.message ? (
                        event.message
                      ) : (
                        t.has(`eventTypes.${event.type}`)
                        ? t(`eventTypes.${event.type}`)
                        : event.type
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {event.order_number && (
                        <Link href={`/admin/orders/${event.order_id}`} className="text-primary hover:underline" dir="ltr">
                          {event.order_number}
                        </Link>
                      )}
                      {event.order_number && ' · '}
                      {formatDateTime(event.created_at, locale)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('latestOrders')}
            <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {tc('viewAll')}
              <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.latestOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('noOrders')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tc('date')}</TableHead>
                  <TableHead>{tc('status')}</TableHead>
                  <TableHead>{tc('total')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.latestOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                        dir="ltr"
                      >
                        {order.order_number}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at, locale)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      {formatPrice(Number(order.total), locale, order.currency)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-primary hover:underline"
                        aria-label={tc('viewDetails')}
                      >
                        <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
