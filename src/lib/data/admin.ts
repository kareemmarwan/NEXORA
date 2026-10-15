import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  Category,
  Order,
  OrderStatus,
  PaymentStatus,
  PaymentMethodType,
  Profile,
  ServiceAddon,
  ServiceWithAddons,
} from '@/types/database';

export interface DashboardStats {
  pendingReview: number;
  inProgress: number;
  deliveredThisMonth: number;
  revenueThisMonth: number;
  latestOrders: Order[];
  revenueByDay: { day: string; revenue: number }[];
}

export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [pendingReview, inProgress, delivered, revenue] = await Promise.all([
    admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending_payment', 'payment_review']),
    admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress'),
    admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'delivered')
      .gte('delivered_at', monthStart),
    admin
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('paid_at', monthStart),
  ]);

  const { data: latest } = await admin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8);

  // Revenue by day for the last 14 days.
  const days: { day: string; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ day: date.toISOString().slice(0, 10), revenue: 0 });
  }
  const dayMap = new Map(days.map((d) => [d.day, d]));

  const { data: paidOrders } = await admin
    .from('orders')
    .select('total, paid_at')
    .eq('payment_status', 'paid')
    .gte('paid_at', days[0]!.day);

  for (const order of paidOrders ?? []) {
    const day = (order.paid_at ?? '').slice(0, 10);
    const entry = dayMap.get(day);
    if (entry) entry.revenue += Number(order.total);
  }

  return {
    pendingReview: pendingReview.count ?? 0,
    inProgress: inProgress.count ?? 0,
    deliveredThisMonth: delivered.count ?? 0,
    revenueThisMonth: (revenue.data ?? []).reduce((sum, o) => sum + Number(o.total), 0),
    latestOrders: latest ?? [],
    revenueByDay: days,
  };
});

export interface AdminOrderFilters {
  search?: string | null;
  status?: OrderStatus | null;
  paymentStatus?: PaymentStatus | null;
  paymentMethod?: PaymentMethodType | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  page?: number;
}

export interface AdminOrdersResult {
  orders: (Order & {
    profiles: Pick<Profile, 'id' | 'full_name'> | null;
  })[];
  total: number;
  page: number;
  pageCount: number;
}

export const getAdminOrders = cache(async (filters: AdminOrderFilters) => {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = 20;

  let query = admin
    .from('orders')
    .select('*, profiles(id, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
  if (filters.paymentMethod) query = query.eq('payment_method_type', filters.paymentMethod);
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
  if (filters.dateTo) query = query.lte('created_at', `${filters.dateTo}T23:59:59`);

  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim();
    if (term.includes('@')) {
      // Search by customer email via auth users list.
      const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const match = users?.users.find((u) => u.email?.toLowerCase().includes(term.toLowerCase()));
      query = match ? query.eq('user_id', match.id) : query.eq('user_id', '00000000-0000-0000-0000-000000000000');
    } else {
      query = query.ilike('order_number', `%${term.replace(/[%_]/g, '\\$&')}%`);
    }
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);

  return {
    orders: error ? [] : (data ?? []),
    total: count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
});

export const getAdminOrder = cache(async (orderId: string) => {
  const admin = createAdminClient();
  const { data } = await admin
    .from('orders')
    .select(
      `*,
      order_items(*),
      order_events(*),
      payment_proofs(*),
      payment_methods(id, label_ar, label_en, type, details_ar, details_en),
      profiles(id, full_name, phone, business_name)`
    )
    .eq('id', orderId)
    .single();

  if (!data) return null;

  return {
    ...data,
    order_items: data.order_items ?? [],
    order_events: (data.order_events ?? []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
    payment_proofs: data.payment_proofs ?? [],
    payment_methods: data.payment_methods ?? null,
    profiles: data.profiles ?? null,
  };
});

export const getAdminServices = cache(async () => {
  const admin = createAdminClient();
  const { data } = await admin
    .from('services')
    .select('*, categories(id, name_ar, name_en, slug), service_addons(*)')
    .order('sort_order', { ascending: true });
  return data ?? [];
});

export const getAdminService = cache(
  async (id: string): Promise<(ServiceWithAddons & { categories: Category | null }) | null> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('services')
      .select('*, categories(*), service_addons(*)')
      .eq('id', id)
      .single();
    if (!data) return null;
    return {
      ...data,
      service_addons: data.service_addons ?? [],
    } as ServiceWithAddons & { categories: Category | null };
  }
);

export const getAdminCategories = cache(async (): Promise<Category[]> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  return data ?? [];
});

export const getAdminPaymentMethods = cache(async () => {
  const admin = createAdminClient();
  const { data } = await admin
    .from('payment_methods')
    .select('*')
    .order('sort_order', { ascending: true });
  return data ?? [];
});

export const getAdminCustomers = cache(async (search?: string | null) => {
  const admin = createAdminClient();

  let profileQuery = admin
    .from('profiles')
    .select('id, full_name, phone, business_name, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (search && search.trim().length > 0) {
    const term = search.trim();
    profileQuery = profileQuery.or(
      `full_name.ilike.%${term.replace(/[%_]/g, '\\$&')}%,business_name.ilike.%${term.replace(/[%_]/g, '\\$&')}%`
    );
  }

  const { data: profiles } = await profileQuery;

  const { data: orders } = await admin.from('orders').select('user_id, total, payment_status');

  const stats = new Map<string, { count: number; total: number }>();
  for (const order of orders ?? []) {
    const entry = stats.get(order.user_id) ?? { count: 0, total: 0 };
    entry.count += 1;
    if (order.payment_status === 'paid') entry.total += Number(order.total);
    stats.set(order.user_id, entry);
  }

  // Resolve emails via auth admin.
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const emailMap = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? '']));

  return (profiles ?? []).map((profile) => ({
    ...profile,
    email: emailMap.get(profile.id) ?? '',
    orderCount: stats.get(profile.id)?.count ?? 0,
    totalSpent: stats.get(profile.id)?.total ?? 0,
  }));
});

export const getAdminCustomer = cache(async (id: string) => {
  const admin = createAdminClient();
  const [{ data: profile }, { data: orders }, users] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).single(),
    admin.from('orders').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const email = users.data?.users.find((u) => u.id === id)?.email ?? '';

  return {
    profile: profile ?? null,
    email,
    orders: orders ?? [],
  };
});

export const getAllAddonsForService = cache(async (serviceId: string): Promise<ServiceAddon[]> => {
  const admin = createAdminClient();
  const { data } = await admin.from('service_addons').select('*').eq('service_id', serviceId);
  return data ?? [];
});
