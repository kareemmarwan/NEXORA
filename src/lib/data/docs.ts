import { cache } from 'react';
import { getSiteContentByKey } from '@/lib/data/content';

export interface DocArticle {
  [key: string]: unknown;
  slug: string;
  section: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  content_ar: string;
  content_en: string;
  reading_minutes: number;
}

export interface DocSection {
  [key: string]: unknown;
  id: string;
  title_ar: string;
  title_en: string;
  icon: 'user' | 'cart' | 'package';
  articles: DocArticle[];
}

function article(
  slug: string,
  section: string,
  title_ar: string,
  title_en: string,
  description_ar: string,
  description_en: string,
  reading_minutes: number,
  content_ar: string,
  content_en: string
): DocArticle {
  return { slug, section, title_ar, title_en, description_ar, description_en, reading_minutes, content_ar, content_en };
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title_ar: 'البداية والحساب',
    title_en: 'Getting started',
    icon: 'user',
    articles: [
      article(
        'create-account',
        'getting-started',
        'كيفية إنشاء حساب جديد',
        'How to create a new account',
        'خطوات بسيطة لإنشاء حسابك والبدء في استخدام المنصة.',
        'Simple steps to create your account and start using the platform.',
        3,
        `## إنشاء حسابك

لإنشاء حساب جديد على المنصة اتبع الخطوات التالية:

1. اضغط على زر **إنشاء حساب** في أعلى الصفحة.
2. أدخل اسمك الكامل وبريدك الإلكتروني.
3. اختر كلمة مرور قوية تتكون من 8 أحرف على الأقل.
4. اضغط على زر التسجيل لإنشاء الحساب.

> ملاحظة: استخدم بريداً إلكترونياً صحيحاً لأن جميع الإشعارات الخاصة بطلباتك ستُرسل إليه.

## تأكيد البريد الإلكتروني

بعد التسجيل سيصلك بريد إلكتروني يحتوي على رابط تأكيد. اضغط على الرابط لتفعيل حسابك. إذا لم يصلك البريد خلال دقائق:

- تحقق من مجلد البريد غير المرغوب (Spam).
- اطلب إرسال رابط التأكيد مرة أخرى من صفحة تسجيل الدخول.

## إكمال بيانات الملف الشخصي

بعد تفعيل الحساب، انتقل إلى صفحة **حسابي** لإضافة اسمك ورقم جوالك. إكمال البيانات يساعدنا في تسليم طلباتك بشكل أسرع.`,
        `## Create your account

To create a new account on the platform, follow these steps:

1. Click the **Sign up** button at the top of the page.
2. Enter your full name and email address.
3. Choose a strong password with at least 8 characters.
4. Click the sign-up button to create your account.

> Note: Use a valid email address because all order notifications will be sent to it.

## Confirm your email

After signing up you will receive an email with a confirmation link. Click the link to activate your account. If the email does not arrive within minutes:

- Check your spam folder.
- Request a new confirmation link from the sign-in page.

## Complete your profile

Once your account is active, go to the **Account** page to add your name and phone number. Completing your profile helps us deliver your orders faster.`
      ),
      article(
        'sign-in',
        'getting-started',
        'تسجيل الدخول واستعادة كلمة المرور',
        'Signing in and password recovery',
        'كيفية تسجيل الدخول إلى حسابك وماذا تفعل إذا نسيت كلمة المرور.',
        'How to sign in to your account and what to do if you forget your password.',
        2,
        `## تسجيل الدخول

ل تسجيل الدخول إلى حسابك:

1. اضغط على **تسجيل الدخول** في أعلى الصفحة.
2. أدخل بريدك الإلكتروني وكلمة المرور.
3. اضغط زر الدخول وسيتم تحويلك إلى الصفحة الرئيسية.

## استعادة كلمة المرور

إذا نسيت كلمة المرور:

1. اضغط على رابط **نسيت كلمة المرور** في صفحة تسجيل الدخول.
2. أدخل بريدك الإلكتروني المسجل.
3. ستصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور.
4. اختر كلمة مرور جديدة ثم سجل الدخول بها.

> لأمان حسابك لا تشارك كلمة المرور مع أي شخص، ويوصى بتغييرها بشكل دوري.`,
        `## Signing in

To sign in to your account:

1. Click **Sign in** at the top of the page.
2. Enter your email and password.
3. Click the sign-in button and you will be taken to the home page.

## Password recovery

If you forgot your password:

1. Click the **Forgot password** link on the sign-in page.
2. Enter your registered email address.
3. You will receive a message with a link to reset your password.
4. Choose a new password and sign in with it.

> For your account security, never share your password with anyone, and it is recommended to change it regularly.`
      ),
    ],
  },
  {
    id: 'purchasing',
    title_ar: 'الشراء والدفع',
    title_en: 'Purchasing & payment',
    icon: 'cart',
    articles: [
      article(
        'browse-services',
        'purchasing',
        'تصفح الخدمات واختيار الخدمة المناسبة',
        'Browsing services and choosing the right one',
        'كيف تتنقل بين أقسام الخدمات وتقرأ تفاصيل كل خدمة قبل الشراء.',
        'How to navigate service categories and read service details before buying.',
        3,
        `## تصفح كتالوج الخدمات

من صفحة **الخدمات** يمكنك استعراض جميع الخدمات المتوفرة. استخدم:

- **البحث**: اكتب كلمة مفتاحية للعثور على خدمة محددة.
- **الأقسام**: فلترة الخدمات حسب القسم (أتمتة، محتوى، تصميم...).
- **الترتيب**: ترتيب النتائج حسب السعر أو الأحدث.

## صفحة تفاصيل الخدمة

اضغط على أي خدمة لعرض صفحتها الكاملة، وستجد فيها:

- وصفاً تفصيلياً لما تقدمه الخدمة.
- خيارات الأسعار: دفعة واحدة أو اشتراك شهري.
- مدة التسليم المتوقعة وعدد التعديلات المسموحة.

> نصيحة: قارن بين الباقات المتوفرة واختر ما يناسب احتياجك — الباقات الشهرية أوفر للاستخدام المستمر.`,
        `## Browsing the catalog

From the **Services** page you can explore all available services. Use:

- **Search**: type a keyword to find a specific service.
- **Categories**: filter services by category (automation, content, design...).
- **Sorting**: order results by price or newest.

## Service details page

Click any service to open its full page, where you will find:

- A detailed description of what the service offers.
- Pricing options: one-time payment or monthly subscription.
- Expected delivery time and the number of allowed revisions.

> Tip: Compare the available plans and pick what fits your needs — monthly plans are more cost-effective for ongoing usage.`
      ),
      article(
        'checkout-guide',
        'purchasing',
        'إضافة الخدمات إلى السلة وإتمام الشراء',
        'Adding services to the cart and completing checkout',
        'خطوات الشراء من اختيار الخدمة حتى تأكيد الطلب.',
        'The purchase steps from selecting a service to confirming the order.',
        3,
        `## إضافة إلى السلة

في صفحة أي خدمة اضغط على زر **أضف إلى السلة**. يمكنك إضافة أكثر من خدمة قبل إتمام الشراء، وسيظهر عدد العناصر بجانب أيقونة السلة.

## مراجعة السلة

افتح صفحة **السلة** لمراجعة طلبك:

- تأكد من الخدمات والكميات.
- راجع الإجمالي النهائي مع أي خصومات.
- يمكنك حذف أي عنصر أو تعديل الكمية.

## إتمام الشراء

1. اضغط زر **إتمام الشراء** من السلة.
2. أدخل أو أكمل بياناتك للفاتورة.
3. اختر طريقة الدفع المناسبة.
4. راجع ملخص الطلب ثم اضغط **تأكيد الطلب**.

سيصلك بريد إلكتروني بتأكيد الطلب، ويمكنك متابعته من صفحة **طلباتي**.`,
        `## Adding to cart

On any service page click the **Add to cart** button. You can add multiple services before checking out, and the item count will appear next to the cart icon.

## Reviewing the cart

Open the **Cart** page to review your order:

- Verify the services and quantities.
- Review the final total with any discounts.
- You can remove any item or change quantities.

## Completing checkout

1. Click the **Checkout** button from the cart.
2. Enter or complete your billing details.
3. Choose your preferred payment method.
4. Review the order summary then click **Confirm order**.

You will receive a confirmation email, and you can track the order from the **My orders** page.`
      ),
      article(
        'payment-methods',
        'purchasing',
        'طرق الدفع المتاحة',
        'Available payment methods',
        'الطرق المقبولة للدفع وكيفية التعامل مع فشل عملية الدفع.',
        'Accepted payment methods and how to handle a failed payment.',
        2,
        `## طرق الدفع

نقبل حالياً الطرق التالية:

- **البطاقات البنكية**: فيزا وماستركارد عبر بوابة دفع آمنة.
- **التحويل البنكي**: للطلبات الكبيرة، مع إرفاق إثبات التحويل.

جميع عمليات الدفع مشفرة وآمنة، ولا نحتفظ ببيانات بطاقتك على أنظمتنا.

## فشل عملية الدفع

إذا فشلت عملية الدفع:

1. تأكد من صحة بيانات البطاقة وأنها مفعلة للدفع الإلكتروني.
2. تأكد من وجود رصيد كافٍ.
3. حاول مرة أخرى أو استخدم بطاقة أخرى.

> إذا خصم المبلغ ولم يُسجل الطلب، تواصل مع الدعم مع رقم العملية وسيتم التحقق فوراً.`,
        `## Payment methods

We currently accept the following:

- **Bank cards**: Visa and Mastercard via a secure payment gateway.
- **Bank transfer**: for large orders, with proof of transfer attached.

All payments are encrypted and secure, and we never store your card details on our systems.

## Failed payments

If your payment fails:

1. Verify your card details and that it is enabled for online payments.
2. Make sure you have sufficient funds.
3. Try again or use a different card.

> If the amount was deducted but the order was not recorded, contact support with the transaction number and it will be verified immediately.`
      ),
    ],
  },
  {
    id: 'after-purchase',
    title_ar: 'بعد الشراء والتسليم',
    title_en: 'After purchase & delivery',
    icon: 'package',
    articles: [
      article(
        'track-orders',
        'after-purchase',
        'تتبع حالة طلباتك',
        'Tracking your order status',
        'كيف تتابع مراحل تنفيذ طلبك من البداية حتى التسليم.',
        'How to follow your order progress from start to delivery.',
        2,
        `## صفحة طلباتي

من قائمة حسابك اختر **طلباتي** لعرض جميع طلباتك مع حالتها الحالية:

- **قيد المراجعة**: تم استلام طلبك وجاري تأكيده.
- **قيد التنفيذ**: فريقنا يعمل على طلبك الآن.
- **مكتمل**: تم تسليم الخدمة بالكامل.
- **ملغي**: تم إلغاء الطلب (سترى سبب الإلغاء).

## تفاصيل الطلب

اضغط على أي طلب لعرض صفحة تفاصيله، وستجد فيها:

- ملخص الخدمات المشتراة والمبلغ المدفوع.
- سجل تحديثات الحالة مع التواريخ.
- ملفات التسليم عند اكتمال الطلب.`,
        `## My orders page

From your account menu choose **My orders** to see all your orders with their current status:

- **Pending review**: your order was received and is being confirmed.
- **In progress**: our team is working on your order.
- **Completed**: the service has been fully delivered.
- **Cancelled**: the order was cancelled (you will see the reason).

## Order details

Click any order to open its details page, where you will find:

- A summary of the purchased services and the paid amount.
- A status history log with dates.
- Delivery files once the order is complete.`
      ),
      article(
        'delivery-process',
        'after-purchase',
        'عملية التسليم والاستلام',
        'Delivery and handover process',
        'ماذا يحدث بعد إتمام الدفع ومتى وكيف تستلم خدماتك.',
        'What happens after payment and when and how you receive your services.',
        3,
        `## ماذا يحدث بعد الدفع؟

بعد تأكيد الدفع:

1. يُسجل طلبك تلقائياً ويصل إشعار لفريق التنفيذ.
2. تتم مراجعة متطلبات الطلب خلال ساعات العمل.
3. يبدأ تنفيذ الطلب حسب مدة التسليم المذكورة في الخدمة.

## استلام التسليم

عند اكتمال الطلب:

- ستصلك رسالة بريد إلكتروني بإشعار الاكتمال.
- ستجد ملفات أو تفاصيل التسليم في صفحة الطلب.
- يمكنك طلب تعديلات ضمن عدد التعديلات المحدد للخدمة.

> راجع التسليم جيداً واطلب التعديلات المطلوبة خلال فترة التعديل المسموحة.`,
        `## What happens after payment?

After your payment is confirmed:

1. Your order is recorded automatically and the delivery team is notified.
2. Order requirements are reviewed during business hours.
3. Execution starts according to the delivery time stated on the service.

## Receiving the delivery

When the order is complete:

- You will receive a completion notification by email.
- Delivery files or details will be available on the order page.
- You can request revisions within the number of revisions defined for the service.

> Review the delivery carefully and request any needed changes within the allowed revision period.`
      ),
      article(
        'support',
        'after-purchase',
        'الدعم والمساعدة',
        'Support and help',
        'كيف تتواصل مع فريق الدعم وما المعلومات التي تساعدنا لخدمتك أسرع.',
        'How to reach the support team and what information helps us serve you faster.',
        2,
        `## التواصل مع الدعم

فريق الدعم متاح لمساعدتك في:

- مشاكل الحساب أو تسجيل الدخول.
- استفسارات الدفع والفواتير.
- أي سؤال عن خدمة قيد التنفيذ.

يمكنك التواصل عبر البريد الإلكتروني أو رقم الجوال المذكورين في أسفل الموقع (صفحة الفوتر).

## لتسريع حل مشكلتك

عند التواصل مع الدعم أرفق دائماً:

1. رقم الطلب (تجده في صفحة طلباتي).
2. البريد الإلكتروني المسجل في حسابك.
3. وصفاً واضحاً للمشكلة أو الاستفسار، مع لقطات شاشة إن أمكن.

> أوقات الاستجابة المعتادة: خلال 24 ساعة في أيام العمل.`,
        `## Contacting support

The support team is available to help you with:

- Account or sign-in issues.
- Payment and invoice inquiries.
- Any question about an order in progress.

You can reach us via the email address or phone number listed at the bottom of the site (footer page).

## To resolve your issue faster

When contacting support, always include:

1. The order number (found on the My orders page).
2. The email registered on your account.
3. A clear description of the issue or question, with screenshots if possible.

> Typical response time: within 24 hours on business days.`
      ),
    ],
  },
];

export const DOC_ARTICLES: DocArticle[] = DOC_SECTIONS.flatMap((s) => s.articles);

// ─── Managed docs (site_content key = 'docs') ───

export interface ManagedDocSection {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: 'user' | 'cart' | 'package';
}

export interface ManagedDocArticle {
  slug: string;
  sectionId: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  readingMinutes: number;
  contentAr: string;
  contentEn: string;
}

export interface ManagedDocs {
  sections: ManagedDocSection[];
  articles: ManagedDocArticle[];
}

export const getManagedDocs = cache(async (): Promise<ManagedDocs | null> => {
  try {
    const row = await getSiteContentByKey('docs');
    const parsed = (row?.content_ar ?? row?.content_en) as ManagedDocs | null;
    if (parsed && Array.isArray(parsed.sections) && Array.isArray(parsed.articles)) {
      return parsed;
    }
  } catch {
    // Fall back to hardcoded docs below.
  }
  return null;
});

function sectionsFromManaged(managed: ManagedDocs): DocSection[] {
  const sections: DocSection[] = managed.sections.map((s) => ({
    id: s.id,
    title_ar: s.titleAr,
    title_en: s.titleEn,
    icon: s.icon,
    articles: [],
  }));

  for (const a of managed.articles) {
    const section = sections.find((s) => s.id === a.sectionId);
    if (!section) continue;
    section.articles.push({
      slug: a.slug,
      section: a.sectionId,
      title_ar: a.titleAr,
      title_en: a.titleEn,
      description_ar: a.descAr,
      description_en: a.descEn,
      content_ar: a.contentAr,
      content_en: a.contentEn,
      reading_minutes: a.readingMinutes,
    });
  }

  return sections.filter((s) => s.articles.length > 0);
}

export const getDocSections = cache(async (): Promise<DocSection[]> => {
  const managed = await getManagedDocs();
  return managed ? sectionsFromManaged(managed) : DOC_SECTIONS;
});

export const getDocArticles = cache(async (): Promise<DocArticle[]> => {
  const sections = await getDocSections();
  return sections.flatMap((s) => s.articles);
});

export const getDocArticleBySlug = cache(async (slug: string): Promise<DocArticle | null> => {
  const articles = await getDocArticles();
  return articles.find((a) => a.slug === slug) ?? null;
});

export const getDocSectionById = cache(async (id: string): Promise<DocSection | null> => {
  const sections = await getDocSections();
  return sections.find((s) => s.id === id) ?? null;
});

export const getDocNeighbors = cache(
  async (slug: string): Promise<{ prev: DocArticle | null; next: DocArticle | null }> => {
    const articles = await getDocArticles();
    const index = articles.findIndex((a) => a.slug === slug);
    if (index === -1) return { prev: null, next: null };
    return {
      prev: index > 0 ? (articles[index - 1] ?? null) : null,
      next: index < articles.length - 1 ? (articles[index + 1] ?? null) : null,
    };
  }
);
