import { describe, it, expect } from 'vitest';
import { createOrderSchema, createAdminSchemas, phoneSchema } from '@/lib/validation';

const t = (key: string) => key;
const adminSchemas = createAdminSchemas(t);

describe('phoneSchema', () => {
  it('accepts valid phone numbers', () => {
    expect(phoneSchema.safeParse('0599123456').success).toBe(true);
    expect(phoneSchema.safeParse('+970599123456').success).toBe(true);
    expect(phoneSchema.safeParse('(059) 912-3456').success).toBe(true);
  });

  it('rejects too short numbers', () => {
    expect(phoneSchema.safeParse('123').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(phoneSchema.safeParse('').success).toBe(false);
  });
});

describe('createOrderSchema', () => {
  const validOrder = {
    items: [{ serviceId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1, addonIds: [] }],
    brief: {
      '550e8400-e29b-41d4-a716-446655440000': {
        answers: ['My answer'],
      },
    },
    paymentMethodType: 'manual' as const,
    paymentMethodId: '550e8400-e29b-41d4-a716-446655440001',
    contactPhone: '0599123456',
  };

  it('accepts a valid order', () => {
    const result = createOrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('rejects when items array is empty', () => {
    const result = createOrderSchema.safeParse({ ...validOrder, items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects invalid quantity', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ ...validOrder.items[0], quantity: 10 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects when brief answers are empty', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      brief: {
        '550e8400-e29b-41d4-a716-446655440000': {
          answers: [],
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects when contactPhone is missing', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      contactPhone: undefined,
    });
    expect(result.success).toBe(false);
  });
});

describe('serviceSchema (admin)', () => {
  it('accepts a valid service', () => {
    const result = adminSchemas.serviceSchema.safeParse({
      slug: 'my-service',
      titleAr: 'خدمة',
      titleEn: 'My Service',
      price: 100,
      deliveryDays: 5,
      revisions: 2,
      currency: 'USD',
      priceType: 'one_time',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid slug characters', () => {
    const result = adminSchemas.serviceSchema.safeParse({
      slug: 'My Service!',
      titleAr: 'خدمة',
      titleEn: 'My Service',
      price: 100,
      deliveryDays: 5,
    });
    expect(result.success).toBe(false);
  });
});