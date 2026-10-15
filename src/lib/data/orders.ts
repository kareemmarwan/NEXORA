import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { OrderWithDetails, Order } from '@/types/database';

export const getMyOrders = cache(async (userId: string): Promise<Order[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
});

export const getOrderForUser = cache(
  async (orderId: string, userId: string): Promise<OrderWithDetails | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select(
        `*,
        order_items(*),
        order_events(*),
        payment_proofs(*),
        payment_methods(id, label_ar, label_en, type),
        profiles(id, full_name, phone, business_name)`
      )
      .eq('id', orderId)
      .single();

    if (error || !data) return null;

    // Ensure the order belongs to the requesting user (RLS enforces this too).
    if (data.user_id !== userId) return null;

    return {
      ...data,
      order_items: data.order_items ?? [],
      order_events: (data.order_events ?? []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
      payment_proofs: data.payment_proofs ?? [],
      payment_methods: data.payment_methods ?? null,
      profiles: data.profiles ?? null,
    } as OrderWithDetails;
  }
);

export async function getSignedProofUrl(
  filePath: string,
  expiresIn = 120
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(filePath, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

export function computeExpectedDeliveryDate(
  paidAt: string | null,
  deliveryDays: number
): Date | null {
  if (!paidAt) return null;
  const date = new Date(paidAt);
  date.setDate(date.getDate() + deliveryDays);
  return date;
}
