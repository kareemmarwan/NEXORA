'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartAddon {
  id: string;
  title_ar: string;
  title_en: string;
  price: number;
  extra_days: number;
}

export interface CartItem {
  serviceId: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  price: number;
  currency: string;
  priceType: 'one_time' | 'monthly';
  deliveryDays: number;
  quantity: number;
  coverImageUrl: string | null;
  addons: CartAddon[];
}

export interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (serviceId: string) => void;
  setQuantity: (serviceId: string, quantity: number) => void;
  setAddons: (serviceId: string, addons: CartAddon[]) => void;
  clearCart: () => void;
}

const MAX_QUANTITY = 5;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.serviceId === item.serviceId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.serviceId === item.serviceId
                  ? {
                      ...i,
                      quantity: Math.min(MAX_QUANTITY, i.quantity + item.quantity),
                      addons: item.addons,
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: Math.min(MAX_QUANTITY, Math.max(1, item.quantity)) }] };
        }),

      removeItem: (serviceId) =>
        set((state) => ({ items: state.items.filter((i) => i.serviceId !== serviceId) })),

      setQuantity: (serviceId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.serviceId === serviceId
              ? { ...i, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) }
              : i
          ),
        })),

      setAddons: (serviceId, addons) =>
        set((state) => ({
          items: state.items.map((i) => (i.serviceId === serviceId ? { ...i, addons } : i)),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'ai-services-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
