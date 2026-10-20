import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json, SiteContent, SiteSetting } from '@/types/database';

export const getSiteSettings = cache(async (): Promise<SiteSetting[]> => {
  const supabase = createClient();
  const { data } = await supabase.from('site_settings').select('*');
  return data ?? [];
});

export const getSiteContent = cache(async (): Promise<SiteContent[]> => {
  const supabase = createClient();
  const { data } = await supabase.from('site_content').select('*');
  return data ?? [];
});

export const getSiteContentByKey = cache(async (key: string): Promise<SiteContent | null> => {
  const supabase = createClient();
  const { data } = await supabase.from('site_content').select('*').eq('key', key).single();
  return data ?? null;
});

export async function getAdminSiteSettings(): Promise<SiteSetting[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('site_settings').select('*').order('key');
  return data ?? [];
}

export async function getAdminSiteContent(): Promise<SiteContent[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('site_content').select('*').order('key');
  return data ?? [];
}

export async function upsertSiteSetting(key: string, valueAr: string, valueEn: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('site_settings')
    .upsert({ key, value_ar: valueAr, value_en: valueEn }, { onConflict: 'key' });
  return { error };
}

export async function upsertSiteContent(key: string, contentAr: Json, contentEn: Json) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('site_content')
    .upsert({ key, content_ar: contentAr, content_en: contentEn }, { onConflict: 'key' });
  return { error };
}