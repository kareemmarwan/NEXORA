import { describe, it, expect } from 'vitest';
import {
  computeItemPricing,
  computeOrderPricing,
  clampQuantity,
  pricingLimits,
} from '@/lib/pricing';

describe('clampQuantity', () => {
  it('clamps below minimum to MIN_QUANTITY', () => {
    expect(clampQuantity(0)).toBe(pricingLimits.MIN_QUANTITY);
    expect(clampQuantity(-5)).toBe(pricingLimits.MIN_QUANTITY);
  });

  it('clamps above maximum to MAX_QUANTITY', () => {
    expect(clampQuantity(100)).toBe(pricingLimits.MAX_QUANTITY);
  });

  it('floors fractional quantities', () => {
    expect(clampQuantity(2.7)).toBe(2);
  });

  it('treats NaN as MIN_QUANTITY', () => {
    expect(clampQuantity(NaN)).toBe(pricingLimits.MIN_QUANTITY);
  });

  it('returns the value when within range', () => {
    expect(clampQuantity(3)).toBe(3);
  });
});

describe('computeItemPricing', () => {
  it('computes price for a single item with no addons', () => {
    const result = computeItemPricing({
      serviceId: 'svc-1',
      unitPrice: 100,
      deliveryDays: 5,
      quantity: 1,
      addons: [],
    });

    expect(result.unitBasePrice).toBe(100);
    expect(result.unitAddonsPrice).toBe(0);
    expect(result.unitTotal).toBe(100);
    expect(result.lineTotal).toBe(100);
    expect(result.deliveryDays).toBe(5);
  });

  it('adds addon prices and extra days correctly', () => {
    const result = computeItemPricing({
      serviceId: 'svc-1',
      unitPrice: 100,
      deliveryDays: 5,
      quantity: 2,
      addons: [
        { id: 'addon-1', price: 20, extra_days: 2 },
        { id: 'addon-2', price: 15, extra_days: 1 },
      ],
    });

    expect(result.unitAddonsPrice).toBe(35);
    expect(result.unitTotal).toBe(135);
    expect(result.lineTotal).toBe(270); // 135 * 2
    expect(result.deliveryDays).toBe(8); // 5 + 2 + 1
    expect(result.addonsExtraDays).toBe(3);
    expect(result.addonsTotalPrice).toBe(70); // 35 * 2
  });

  it('handles edge case with price 0', () => {
    const result = computeItemPricing({
      serviceId: 'svc-free',
      unitPrice: 0,
      deliveryDays: 1,
      quantity: 1,
      addons: [],
    });
    expect(result.unitTotal).toBe(0);
    expect(result.lineTotal).toBe(0);
  });
});

describe('computeOrderPricing', () => {
  it('sums multiple items correctly', () => {
    const result = computeOrderPricing([
      { serviceId: 'a', unitPrice: 100, deliveryDays: 5, quantity: 1, addons: [] },
      { serviceId: 'b', unitPrice: 200, deliveryDays: 10, quantity: 2, addons: [] },
    ]);

    expect(result.subtotal).toBe(500); // 100 + 200*2
    expect(result.total).toBe(500);
    expect(result.maxDeliveryDays).toBe(10);
  });

  it('returns 0 for empty items', () => {
    const result = computeOrderPricing([]);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.maxDeliveryDays).toBe(0);
  });

  it('rounds money correctly to 2 decimal places', () => {
    const result = computeOrderPricing([
      { serviceId: 'a', unitPrice: 33.333, deliveryDays: 1, quantity: 3, addons: [] },
    ]);
    expect(result.subtotal).toBe(99.99); // 33.33 * 3 = 99.99
  });

  it('includes addons in subtotal for multiple items', () => {
    const result = computeOrderPricing([
      {
        serviceId: 'a',
        unitPrice: 100,
        deliveryDays: 5,
        quantity: 1,
        addons: [{ id: 'x', price: 50, extra_days: 3 }],
      },
    ]);
    expect(result.subtotal).toBe(150);
    expect(result.maxDeliveryDays).toBe(8);
  });
});