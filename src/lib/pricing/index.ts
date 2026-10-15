/**
 * Pure pricing logic shared by the UI and the order API.
 * Nothing in here touches the network or the database.
 */

export interface PricingAddonInput {
  id: string;
  price: number;
  extra_days: number;
}

export interface PricingItemInput {
  serviceId: string;
  unitPrice: number;
  deliveryDays: number;
  quantity: number;
  addons: PricingAddonInput[];
}

export interface ItemPricing {
  serviceId: string;
  quantity: number;
  unitBasePrice: number;
  unitAddonsPrice: number;
  unitTotal: number;
  lineTotal: number;
  deliveryDays: number;
  addonsTotalPrice: number;
  addonsExtraDays: number;
}

export interface OrderPricing {
  items: ItemPricing[];
  subtotal: number;
  total: number;
  maxDeliveryDays: number;
  currency: string;
}

const MAX_QUANTITY = 5;
const MIN_QUANTITY = 1;

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY;
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.floor(quantity)));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeItemPricing(item: PricingItemInput): ItemPricing {
  const quantity = clampQuantity(item.quantity);
  const unitBasePrice = roundMoney(item.unitPrice);
  const addons = item.addons ?? [];
  const unitAddonsPrice = roundMoney(addons.reduce((sum, addon) => sum + Number(addon.price || 0), 0));
  const addonsExtraDays = addons.reduce((sum, addon) => sum + Math.max(0, Math.floor(addon.extra_days || 0)), 0);
  const unitTotal = roundMoney(unitBasePrice + unitAddonsPrice);
  const lineTotal = roundMoney(unitTotal * quantity);
  const deliveryDays = Math.max(0, Math.floor(item.deliveryDays)) + addonsExtraDays;

  return {
    serviceId: item.serviceId,
    quantity,
    unitBasePrice,
    unitAddonsPrice,
    unitTotal,
    lineTotal,
    deliveryDays,
    addonsTotalPrice: roundMoney(unitAddonsPrice * quantity),
    addonsExtraDays,
  };
}

export function computeOrderPricing(items: PricingItemInput[], currency = 'USD'): OrderPricing {
  const priced = items.map(computeItemPricing);
  const subtotal = roundMoney(priced.reduce((sum, item) => sum + item.lineTotal, 0));
  const maxDeliveryDays = priced.reduce((max, item) => Math.max(max, item.deliveryDays), 0);
  return {
    items: priced,
    subtotal,
    total: subtotal,
    maxDeliveryDays,
    currency,
  };
}

export const pricingLimits = {
  MIN_QUANTITY,
  MAX_QUANTITY,
} as const;
