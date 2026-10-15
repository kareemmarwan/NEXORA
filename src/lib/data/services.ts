import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  DEMO_CATEGORIES,
  DEMO_SERVICES,
  DEMO_ADDONS,
  DEMO_PAYMENT_METHODS,
} from '@/lib/data/demo';
import type {
  Category,
  ServiceAddon,
  Service,
  ServiceWithAddons,
  PaymentMethod,
} from '@/types/database';

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export type CatalogSort = 'featured' | 'price_asc' | 'price_desc' | 'fastest';

export interface CatalogFilters {
  category?: string | null;
  search?: string | null;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
}

export const getCategories = cache(async (includeInactive = false): Promise<Category[]> => {
  if (!supabaseConfigured()) {
    return includeInactive ? DEMO_CATEGORIES : DEMO_CATEGORIES.filter((c) => c.is_active);
  }
  const supabase = createClient();
  let query = supabase.from('categories').select('*');
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query.order('sort_order', { ascending: true });
  if (error) return [];
  return data ?? [];
});

export const getFeaturedServices = cache(async (limit = 6): Promise<Service[]> => {
  if (!supabaseConfigured()) {
    return DEMO_SERVICES.filter((s) => s.is_featured && s.is_active).slice(0, limit);
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
    .limit(limit);
  if (error) return [];
  return data ?? [];
});

export interface CatalogResult {
  services: Service[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export const getCatalog = cache(async (filters: CatalogFilters): Promise<CatalogResult> => {
  if (!supabaseConfigured()) {
    let services = DEMO_SERVICES.filter((s) => s.is_active);
    if (filters.category) {
      const cat = DEMO_CATEGORIES.find((c) => c.slug === filters.category);
      if (cat) services = services.filter((s) => s.category_id === cat.id);
    }
    if (filters.search && filters.search.trim().length > 0) {
      const term = filters.search.trim().toLowerCase();
      services = services.filter(
        (s) =>
          s.title_ar.toLowerCase().includes(term) ||
          s.title_en.toLowerCase().includes(term) ||
          (s.short_desc_ar ?? '').toLowerCase().includes(term) ||
          (s.short_desc_en ?? '').toLowerCase().includes(term)
      );
    }
    switch (filters.sort) {
      case 'price_asc': services.sort((a, b) => a.price - b.price); break;
      case 'price_desc': services.sort((a, b) => b.price - a.price); break;
      case 'fastest': services.sort((a, b) => a.delivery_days - b.delivery_days); break;
      case 'featured': default: services.sort((a, b) => a.sort_order - b.sort_order); break;
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(24, Math.max(1, filters.pageSize ?? 9));
    const total = services.length;
    const from = (page - 1) * pageSize;
    return {
      services: services.slice(from, from + pageSize),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
  const supabase = createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, filters.pageSize ?? 9));

  let query = supabase
    .from('services')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (filters.category) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.category)
      .single();
    if (category) {
      query = query.eq('category_id', category.id);
    }
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim().replace(/[%_()]/g, '\\$&');
    query = query.or(`title_ar.ilike.%${term}%,title_en.ilike.%${term}%,short_desc_ar.ilike.%${term}%,short_desc_en.ilike.%${term}%`);
  }

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'fastest':
      query = query.order('delivery_days', { ascending: true });
      break;
    case 'featured':
    default:
      query = query
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true });
      break;
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);

  if (error) {
    return { services: [], total: 0, page: 1, pageSize, pageCount: 0 };
  }

  const total = count ?? 0;
  return {
    services: data ?? [],
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
});

export const getServiceBySlug = cache(async (slug: string): Promise<ServiceWithAddons | null> => {
  if (!supabaseConfigured()) {
    const service = DEMO_SERVICES.find((s) => s.slug === slug && s.is_active);
    if (!service) return null;
    const addons = DEMO_ADDONS.filter((a) => a.service_id === service.id && a.is_active);
    const category = DEMO_CATEGORIES.find((c) => c.id === service.category_id) ?? null;
    return {
      ...service,
      service_addons: addons,
      categories: category ? { id: category.id, slug: category.slug, name_ar: category.name_ar, name_en: category.name_en } : null,
    } as ServiceWithAddons;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*, service_addons(*), categories(id, slug, name_ar, name_en)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    service_addons: (data.service_addons ?? []) as ServiceAddon[],
  } as ServiceWithAddons;
});

export const getRelatedServices = cache(
  async (categoryId: string | null, excludeId: string, limit = 3): Promise<Service[]> => {
    if (!supabaseConfigured()) {
      return DEMO_SERVICES.filter((s) => s.is_active && s.id !== excludeId && (categoryId ? s.category_id === categoryId : true))
        .sort((a, b) => a.sort_order - b.sort_order)
        .slice(0, limit);
    }
    const supabase = createClient();
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .neq('id', excludeId)
      .limit(limit);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });
    if (error) return [];
    return data ?? [];
  }
);

export const getActivePaymentMethods = cache(async (): Promise<PaymentMethod[]> => {
  if (!supabaseConfigured()) {
    return DEMO_PAYMENT_METHODS.filter((m) => m.is_active);
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return data ?? [];
});
