import { z } from 'zod';

export const localeSchema = z.enum(['ar', 'en']);

export const orderStatusSchema = z.enum([
  'pending_payment',
  'payment_review',
  'paid',
  'in_progress',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
]);

export const paymentStatusSchema = z.enum(['unpaid', 'under_review', 'paid', 'failed', 'refunded']);
export const paymentMethodTypeSchema = z.enum(['manual', 'stripe']);
export const priceTypeSchema = z.enum(['one_time', 'monthly']);
export const proofStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const phoneSchema = z
  .string()
  .trim()
  .min(6, 'validation.phoneInvalid')
  .max(30, 'validation.phoneInvalid')
  .regex(/^[+\d(][\d\s()-]{5,29}$/, 'validation.phoneInvalid');

export function createAuthSchemas(t: (key: string) => string) {
  const email = z
    .string()
    .trim()
    .min(1, t('validation.emailRequired'))
    .email(t('validation.emailInvalid'));

  const password = z
    .string()
    .min(1, t('validation.passwordRequired'))
    .min(6, t('validation.passwordMin'));

  const loginSchema = z.object({
    email,
    password,
    rememberMe: z.boolean().optional(),
  });

  const registerSchema = z
    .object({
      fullName: z.string().trim().min(2, t('validation.nameRequired')).max(120),
      email,
      password,
      confirmPassword: z.string().min(1, t('validation.passwordRequired')),
      phone: z.union([phoneSchema, z.literal('')]).optional(),
      businessName: z.string().trim().max(120).optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordMatch'),
      path: ['confirmPassword'],
    });

  const forgotPasswordSchema = z.object({ email });

  const resetPasswordSchema = z
    .object({
      password,
      confirmPassword: z.string().min(1, t('validation.passwordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordMatch'),
      path: ['confirmPassword'],
    });

  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, t('validation.currentPasswordRequired')),
    newPassword: password,
  });

  const profileSchema = z.object({
    fullName: z.string().trim().min(2, t('validation.nameRequired')).max(120),
    phone: z.union([phoneSchema, z.literal('')]).optional(),
    businessName: z.string().trim().max(120).optional(),
    preferredLocale: localeSchema,
  });

  return {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    profileSchema,
  };
}

export type LoginInput = z.infer<ReturnType<typeof createAuthSchemas>['loginSchema']>;
export type RegisterInput = z.infer<ReturnType<typeof createAuthSchemas>['registerSchema']>;
export type ForgotPasswordInput = z.infer<
  ReturnType<typeof createAuthSchemas>['forgotPasswordSchema']
>;
export type ResetPasswordInput = z.infer<
  ReturnType<typeof createAuthSchemas>['resetPasswordSchema']
>;
export type ChangePasswordInput = z.infer<
  ReturnType<typeof createAuthSchemas>['changePasswordSchema']
>;
export type ProfileInput = z.infer<ReturnType<typeof createAuthSchemas>['profileSchema']>;

// ---- Checkout / order creation ----

export const orderItemInputSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.number().int().min(1).max(5),
  addonIds: z.array(z.string().uuid()).max(10).default([]),
});

export const briefEntrySchema = z.object({
  answers: z.array(z.string().trim().min(1).max(2000)).min(1).max(20),
  notes: z.string().trim().max(2000).optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1).max(10),
  brief: z.record(z.string().uuid(), briefEntrySchema),
  paymentMethodType: paymentMethodTypeSchema,
  paymentMethodId: z.string().uuid().nullable().optional(),
  customerNotes: z.string().trim().max(3000).optional(),
  contactPhone: phoneSchema,
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type BriefEntry = z.infer<typeof briefEntrySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ---- Payment proof upload ----

export const MAX_PROOF_SIZE = 5 * 1024 * 1024;
export const PROOF_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

export const uploadProofSchema = z.object({
  orderId: z.string().uuid(),
  note: z.string().trim().max(1000).optional(),
});

// ---- Admin schemas ----

export function createAdminSchemas(t: (key: string) => string) {
  const categorySchema = z.object({
    slug: z
      .string()
      .trim()
      .min(1, t('validation.slugRequired'))
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('validation.slugInvalid')),
    nameAr: z.string().trim().min(1, t('validation.titleRequired')).max(120),
    nameEn: z.string().trim().min(1, t('validation.titleRequired')).max(120),
    descriptionAr: z.string().trim().max(2000).optional(),
    descriptionEn: z.string().trim().max(2000).optional(),
    icon: z.string().trim().max(60).optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    isActive: z.boolean().default(true),
  });

  const faqSchema = z.object({
    q_ar: z.string().trim().min(1).max(500),
    a_ar: z.string().trim().min(1).max(4000),
    q_en: z.string().trim().min(1).max(500),
    a_en: z.string().trim().min(1).max(4000),
  });

  const addonSchema = z.object({
    id: z.string().uuid().optional(),
    titleAr: z.string().trim().min(1).max(200),
    titleEn: z.string().trim().min(1).max(200),
    price: z.coerce.number().min(0).max(100000),
    extraDays: z.coerce.number().int().min(0).max(365).default(0),
    isActive: z.boolean().default(true),
    deleted: z.boolean().optional(),
  });

  const serviceSchema = z.object({
    slug: z
      .string()
      .trim()
      .min(1, t('validation.slugRequired'))
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('validation.slugInvalid')),
    categoryId: z.string().uuid().nullable().optional(),
    titleAr: z.string().trim().min(1, t('validation.titleRequired')).max(200),
    titleEn: z.string().trim().min(1, t('validation.titleRequired')).max(200),
    shortDescAr: z.string().trim().max(500).optional(),
    shortDescEn: z.string().trim().max(500).optional(),
    descriptionAr: z.string().trim().max(20000).optional(),
    descriptionEn: z.string().trim().max(20000).optional(),
    price: z.coerce.number().min(0, t('validation.priceInvalid')).max(100000),
    currency: z.string().trim().min(1).max(8).default('USD'),
    priceType: priceTypeSchema.default('one_time'),
    deliveryDays: z.coerce.number().int().min(1).max(365),
    revisions: z.coerce.number().int().min(0).max(20),
    featuresAr: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
    featuresEn: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
    requirementsAr: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
    requirementsEn: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
    faqs: z.array(faqSchema).max(30).default([]),
    coverImageUrl: z.string().trim().max(1000).nullable().optional(),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    addons: z.array(addonSchema).max(20).default([]),
  });

  const paymentMethodSchema = z.object({
    type: paymentMethodTypeSchema.default('manual'),
    labelAr: z.string().trim().min(1, t('validation.titleRequired')).max(120),
    labelEn: z.string().trim().min(1, t('validation.titleRequired')).max(120),
    detailsAr: z.string().trim().max(5000).optional(),
    detailsEn: z.string().trim().max(5000).optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    isActive: z.boolean().default(true),
  });

  const orderStatusUpdateSchema = z.object({
    status: orderStatusSchema,
    message: z.string().trim().max(2000).optional(),
    deliveryNotes: z.string().trim().max(10000).optional(),
    internalNotes: z.string().trim().max(10000).optional(),
  });

  const blogPostSchema = z.object({
    slug: z
      .string()
      .trim()
      .min(1, t('validation.slugRequired'))
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('validation.slugInvalid')),
    titleAr: z.string().trim().min(1, t('validation.titleRequired')).max(200),
    titleEn: z.string().trim().min(1, t('validation.titleRequired')).max(200),
    excerptAr: z.string().trim().max(500).optional(),
    excerptEn: z.string().trim().max(500).optional(),
    contentAr: z.string().trim().max(100000).optional(),
    contentEn: z.string().trim().max(100000).optional(),
    coverImageUrl: z.string().trim().max(1000).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
    authorName: z.string().trim().max(120).optional(),
    readingMinutes: z.coerce.number().int().min(1).max(120).default(5),
    isPublished: z.boolean().default(false),
    publishedAt: z.string().datetime().nullable().optional(),
  });

  const customerUpdateSchema = z.object({
    fullName: z.string().trim().min(2, t('validation.nameRequired')).max(120),
    phone: z.union([phoneSchema, z.literal('')]).optional(),
    businessName: z.string().trim().max(120).optional(),
    role: z.enum(['customer', 'admin']).optional(),
  });

  const docsSectionSchema = z.object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(60)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('validation.slugInvalid')),
    titleAr: z.string().trim().min(1, t('validation.titleRequired')).max(120),
    titleEn: z.string().trim().min(1, t('validation.titleRequired')).max(120),
    icon: z.enum(['user', 'cart', 'package']).default('user'),
  });

  const docsArticleSchema = z.object({
    slug: z
      .string()
      .trim()
      .min(1, t('validation.slugRequired'))
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('validation.slugInvalid')),
    sectionId: z.string().trim().min(1).max(60),
    titleAr: z.string().trim().min(1, t('validation.titleRequired')).max(200),
    titleEn: z.string().trim().min(1, t('validation.titleRequired')).max(200),
    descAr: z.string().trim().max(500).default(''),
    descEn: z.string().trim().max(500).default(''),
    readingMinutes: z.coerce.number().int().min(1).max(120).default(5),
    contentAr: z.string().trim().max(100000).default(''),
    contentEn: z.string().trim().max(100000).default(''),
  });

  const docsSaveSchema = z
    .object({
      sections: z.array(docsSectionSchema).max(12),
      articles: z.array(docsArticleSchema).max(60),
    })
    .refine(
      (data) => {
        const ids = new Set(data.sections.map((s) => s.id));
        return data.articles.every((a) => ids.has(a.sectionId));
      },
      { message: 'validation.docsSectionMissing' }
    );

  return {
    categorySchema,
    serviceSchema,
    paymentMethodSchema,
    orderStatusUpdateSchema,
    blogPostSchema,
    customerUpdateSchema,
    docsSaveSchema,
    faqSchema,
    addonSchema,
  };
}

export type CategoryInput = z.infer<ReturnType<typeof createAdminSchemas>['categorySchema']>;
export type ServiceInput = z.infer<ReturnType<typeof createAdminSchemas>['serviceSchema']>;
export type PaymentMethodInput = z.infer<
  ReturnType<typeof createAdminSchemas>['paymentMethodSchema']
>;
export type OrderStatusUpdateInput = z.infer<
  ReturnType<typeof createAdminSchemas>['orderStatusUpdateSchema']
>;
export type BlogPostInput = z.infer<ReturnType<typeof createAdminSchemas>['blogPostSchema']>;
