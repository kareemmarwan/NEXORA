-- ============================================================
-- CMS tables for full site content management
-- ============================================================

-- ---------- site_settings (key-value pairs for general settings) ----------
create table if not exists public.site_settings (
  key text primary key,
  value_ar text not null default '',
  value_en text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------- site_content (structured content sections) ----------
create table if not exists public.site_content (
  key text primary key,
  content_ar jsonb not null default '{}'::jsonb,
  content_en jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.site_settings enable row level security;
alter table public.site_content enable row level security;

-- site_settings: public read, admin write
drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public" on public.site_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all" on public.site_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- site_content: public read, admin write
drop policy if exists "site_content_select_public" on public.site_content;
create policy "site_content_select_public" on public.site_content
  for select to anon, authenticated
  using (true);

drop policy if exists "site_content_admin_all" on public.site_content;
create policy "site_content_admin_all" on public.site_content
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Seed default site_settings ----------
insert into public.site_settings (key, value_ar, value_en) values
  ('site_name', 'NEXORA', 'NEXORA'),
  ('site_tagline', 'ابنِ بذكاء أكبر، وانمُ بسرعة أكبر.', 'Build smarter, grow faster.'),
  ('contact_email', 'support@example.com', 'support@example.com'),
  ('contact_phone', '+970 599 000 000', '+970 599 000 000'),
  ('footer_description', 'تبني NEXORA وكلاء ذكاء اصطناعي وتؤتمت العمليات وتطور موظفين رقميين للشركات الناشئة والمشاريع النامية.', 'NEXORA builds AI agents, automates operations, and develops digital employees for startups and growing businesses.')
on conflict (key) do nothing;

-- ---------- Seed default site_content ----------
insert into public.site_content (key, content_ar, content_en) values
  ('hero', jsonb_build_object(
    'title', 'حوّل أعمالك إلى منظومة أكثر ذكاءً.',
    'subtitle', 'نبني وكلاء الذكاء الاصطناعي، ونؤتمت العمليات، ونطوّر موظفين رقميين يساعدون الشركات الناشئة والمشاريع التجارية على العمل بكفاءة أكبر.',
    'cta', 'ابدأ مشروعك',
    'secondaryCta', 'اكتشف خدماتنا',
    'brandLabel', 'وكلاء الذكاء الاصطناعي • الأتمتة • القوة العاملة الرقمية'
  ), jsonb_build_object(
    'title', 'Transform your business into a smarter ecosystem.',
    'subtitle', 'We build AI agents, automate operations, and develop digital employees that help startups and businesses work more efficiently.',
    'cta', 'Start your project',
    'secondaryCta', 'Explore our services',
    'brandLabel', 'AI Agents • Automation • Digital Workforce'
  )),
  ('services', jsonb_build_object(
    'title', 'ما نبنيه',
    'subtitle', 'حلول مدعومة بالذكاء الاصطناعي تساعد عملك على العمل بذكاء والنمو بسرعة.',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'وكلاء الذكاء الاصطناعي', 'desc', 'وكلاء متخصصون ينفذون مهام محددة باستخدام الأدوات المعتمدة وبيانات الأعمال.'),
      jsonb_build_object('title', 'أتمتة الأعمال', 'desc', 'أتمتة العمليات المتكررة وربط تطبيقات أعمالك الحالية.'),
      jsonb_build_object('title', 'القوة العاملة الرقمية', 'desc', 'موظفون رقميون مدعومون بالذكاء الاصطناعي يدعمون التسويق والمبيعات وخدمة العملاء والعمليات.'),
      jsonb_build_object('title', 'تكاملات الذكاء الاصطناعي', 'desc', 'ربط نماذج وخدمات الذكاء الاصطناعي بمواقعك وتطبيقاتك وقواعد بياناتك وأنظمة أعمالك.'),
      jsonb_build_object('title', 'حلول ذكاء اصطناعي مخصصة', 'desc', 'بناء تطبيقات وأنظمة مدعومة بالذكاء الاصطناعي مصممة لمتطلبات أعمال محددة.')
    )
  ), jsonb_build_object(
    'title', 'What we build',
    'subtitle', 'AI-powered solutions that help your business work smarter and grow faster.',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'AI Agents', 'desc', 'Specialized agents that execute specific tasks using authorized tools and business data.'),
      jsonb_build_object('title', 'Business Automation', 'desc', 'Automate repetitive processes and connect your existing business applications.'),
      jsonb_build_object('title', 'Digital Workforce', 'desc', 'AI-powered digital employees that support marketing, sales, customer service, and operations.'),
      jsonb_build_object('title', 'AI Integrations', 'desc', 'Connect AI models and services to your websites, apps, databases, and business systems.'),
      jsonb_build_object('title', 'Custom AI Solutions', 'desc', 'Build AI-powered applications and systems designed for specific business requirements.')
    )
  )),
  ('howItWorks', jsonb_build_object(
    'title', 'كيف نعمل',
    'subtitle', 'أربع خطوات واضحة من فهم أعمالك إلى تحقيق نتائج ملموسة.',
    'steps', jsonb_build_array(
      jsonb_build_object('title', 'نفهم أعمالك', 'desc', 'نفهم نشاطك التجاري وأهدافك.'),
      jsonb_build_object('title', 'نحدد الفرص', 'desc', 'نحدد فرص التطوير والأتمتة.'),
      jsonb_build_object('title', 'نبني الحل', 'desc', 'نطور الحل ونربط الأنظمة المطلوبة.'),
      jsonb_build_object('title', 'نحسّن الأداء', 'desc', 'نقيّم النتائج ونحسّن التنفيذ.')
    )
  ), jsonb_build_object(
    'title', 'How we work',
    'subtitle', 'Four clear steps from understanding your business to delivering tangible results.',
    'steps', jsonb_build_array(
      jsonb_build_object('title', 'Understand your business', 'desc', 'We understand your business and goals.'),
      jsonb_build_object('title', 'Identify opportunities', 'desc', 'We identify development and automation opportunities.'),
      jsonb_build_object('title', 'Build the solution', 'desc', 'We develop the solution and connect the required systems.'),
      jsonb_build_object('title', 'Optimize performance', 'desc', 'We evaluate results and optimize implementation.')
    )
  )),
  ('whyUs', jsonb_build_object(
    'title', 'لماذا NEXORA',
    'subtitle', 'حلول مصممة وفق احتياجات عملك الحقيقية، لا قوالب جاهزة.',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'مصممة لعملياتك', 'desc', 'حلول مبنية حول عمليات أعمالك الفعلية وعملياتك اليومية.'),
      jsonb_build_object('title', 'عمل أقل تكراراً', 'desc', 'قلّل الوقت المستغرق في المهام الروتينية ليتفرغ فريقك لعمل أعلى قيمة.'),
      jsonb_build_object('title', 'تعمل مع أدواتك الحالية', 'desc', 'اربط إمكانيات الذكاء الاصطناعي بالبرمجيات والمنصات التي يستخدمها عملك بالفعل.'),
      jsonb_build_object('title', 'قابل للتوسع مع نموك', 'desc', 'تنفيذات تنمو مع أعمالك وتتكيف مع المتطلبات المتزايدة.'),
      jsonb_build_object('title', 'آمن مع مراجعة بشرية', 'desc', 'صلاحيات مناسبة ومراجعة بشرية مدمجة للإجراءات والقرارات الحساسة.'),
      jsonb_build_object('title', 'تحسين مستمر', 'desc', 'تقييم وتحسين مستمر عند تضمينه في نطاق العمل.')
    )
  ), jsonb_build_object(
    'title', 'Why NEXORA',
    'subtitle', 'Solutions designed for your real business needs, not ready-made templates.',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Designed for your operations', 'desc', 'Solutions built around your actual business operations and daily workflows.'),
      jsonb_build_object('title', 'Less repetitive work', 'desc', 'Reduce time spent on routine tasks so your team can focus on higher-value work.'),
      jsonb_build_object('title', 'Works with your current tools', 'desc', 'Connect AI capabilities with the software and platforms your business already uses.'),
      jsonb_build_object('title', 'Scales with your growth', 'desc', 'Implementations that grow with your business and adapt to increasing requirements.'),
      jsonb_build_object('title', 'Secure with human review', 'desc', 'Appropriate permissions and built-in human review for sensitive actions and decisions.'),
      jsonb_build_object('title', 'Continuous improvement', 'desc', 'Ongoing evaluation and optimization when embedded in scope.')
    )
  )),
  ('audience', jsonb_build_object(
    'title', 'من نعمل معهم',
    'subtitle', 'حلول للشركات في كل مرحلة نمو.',
    'items', jsonb_build_array('الشركات الناشئة', 'الشركات الصغيرة والمتوسطة', 'التجارة الإلكترونية', 'الشركات الخدمية', 'الفرق التجارية النامية')
  ), jsonb_build_object(
    'title', 'Who we work with',
    'subtitle', 'Solutions for businesses at every growth stage.',
    'items', jsonb_build_array('Startups', 'Small & Medium Businesses', 'E-commerce', 'Service Companies', 'Growing Sales Teams')
  )),
  ('faq', jsonb_build_object(
    'title', 'الأسئلة الشائعة',
    'subtitle', 'إجابات سريعة عن الخدمات والدفع والتسليم',
    'items', jsonb_build_array(
      jsonb_build_object('q', 'هل أحتاج خبرة تقنية لاستخدام الخدمة؟', 'a', 'لا. كل ما نحتاجه منك هو معلومات نشاطك، ونتولى نحن البناء والإعداد والتسليم مع شرح طريقة الاستخدام.'),
      jsonb_build_object('q', 'كم تستغرق مدة التسليم؟', 'a', 'تختلف بحسب الخدمة، وتتراوح غالباً بين يومين وعشرة أيام عمل من تأكيد الدفع واستلام المتطلبات.'),
      jsonb_build_object('q', 'هل يمكنني طلب تعديلات بعد التسليم؟', 'a', 'نعم، كل خدمة تتضمن عدد مراجعات محدداً يمكنك استخدامها خلال 7 أيام من التسليم.'),
      jsonb_build_object('q', 'كيف يتم الدفع؟', 'a', 'يمكنك الدفع يدوياً (تحويل بنكي أو محفظة إلكترونية) مع رفع إثبات الدفع، أو الدفع إلكترونياً عبر Stripe.'),
      jsonb_build_object('q', 'هل أحتاج لحساب لطلب الخدمة؟', 'a', 'نعم، نحتاج حساباً بسيطاً لمتابعة طلبك وإرسال التحديثات والتسليم.'),
      jsonb_build_object('q', 'هل البيانات التي أرسلها آمنة؟', 'a', 'نعم، جميع البيانات والملفات محفوظة بآمان وتُستخدم فقط لتنفيذ طلبك.')
    )
  ), jsonb_build_object(
    'title', 'Frequently Asked Questions',
    'subtitle', 'Quick answers about services, payment, and delivery',
    'items', jsonb_build_array(
      jsonb_build_object('q', 'Do I need technical expertise to use the service?', 'a', 'No. All we need is your business information, and we handle the building, setup, and delivery with usage instructions.'),
      jsonb_build_object('q', 'How long does delivery take?', 'a', 'It varies by service, generally between 2 and 10 business days from payment confirmation and requirements receipt.'),
      jsonb_build_object('q', 'Can I request revisions after delivery?', 'a', 'Yes, each service includes a specific number of revisions you can use within 7 days of delivery.'),
      jsonb_build_object('q', 'How do I pay?', 'a', 'You can pay manually (bank transfer or e-wallet) with proof upload, or pay electronically via Stripe.'),
      jsonb_build_object('q', 'Do I need an account to order?', 'a', 'Yes, we need a simple account to track your order and send updates and delivery.'),
      jsonb_build_object('q', 'Is my data safe?', 'a', 'Yes, all data and files are stored securely and used only to fulfill your order.')
    )
  )),
  ('pricing', jsonb_build_object(
    'title', 'أسعار بسيطة وشفافة',
    'subtitle', 'بدون رسوم مخفية. بدون التزامات. يمكنك الإلغاء في أي وقت.',
    'plans', jsonb_build_array(
      jsonb_build_object('name', 'مجاني', 'desc', 'جرّب المنصة', 'price', '$0', 'features', jsonb_build_array('تصفح جميع الخدمات', 'توصيات AI أساسية', 'دعم عبر البريد الإلكتروني'), 'cta', 'ابدأ مجاناً'),
      jsonb_build_object('name', 'احترافي', 'desc', 'للمحترفين', 'price', '$49', 'features', jsonb_build_array('كل مميزات المجاني', 'مساعد AI متقدم', 'تحليلات متقدمة', 'دعم أولوية', 'سير عمل مخصص'), 'cta', 'ابدأ الآن'),
      jsonb_build_object('name', 'مؤسسات', 'desc', 'للفرق', 'price', '$199', 'features', jsonb_build_array('كل مميزات الاحترافي', 'أعضاء فريق غير محدودين', 'وصول API', 'دعم مخصص', 'تكاملات مخصصة', 'ضمان SLA'), 'cta', 'تواصل معنا')
    )
  ), jsonb_build_object(
    'title', 'Simple, transparent pricing',
    'subtitle', 'No hidden fees. No commitments. Cancel anytime.',
    'plans', jsonb_build_array(
      jsonb_build_object('name', 'Free', 'desc', 'Try it out', 'price', '$0', 'features', jsonb_build_array('Browse all services', 'Basic AI recommendations', 'Email support'), 'cta', 'Start for free'),
      jsonb_build_object('name', 'Pro', 'desc', 'For professionals', 'price', '$49', 'features', jsonb_build_array('Everything in Free', 'Priority AI assistant', 'Advanced analytics', 'Priority support', 'Custom workflows'), 'cta', 'Get started'),
      jsonb_build_object('name', 'Enterprise', 'desc', 'For teams', 'price', '$199', 'features', jsonb_build_array('Everything in Pro', 'Unlimited team members', 'API access', 'Dedicated support', 'Custom integrations', 'SLA guarantee'), 'cta', 'Contact us')
    )
  )),
  ('cta', jsonb_build_object(
    'title', 'هل أنت مستعد لتطوير طريقة عملك؟',
    'subtitle', 'أخبرنا عن مشروعك والمهام التي تريد تحسينها، وسنساعدك على تحديد الحل الذكي المناسب للبدء.',
    'button', 'لنبدأ ببناء الحل المناسب',
    'brandLabel', 'وكلاء الذكاء الاصطناعي • الأتمتة • القوة العاملة الرقمية'
  ), jsonb_build_object(
    'title', 'Ready to upgrade the way you work?',
    'subtitle', 'Tell us about your project and the tasks you want to improve, and we will help you find the right smart solution to get started.',
    'button', 'Let''s build the right solution',
    'brandLabel', 'AI Agents • Automation • Digital Workforce'
  )),
  ('footer', jsonb_build_object(
    'tagline', 'ابنِ بذكاء أكبر، وانمُ بسرعة أكبر.',
    'quickLinks', 'روابط سريعة',
    'services', 'الخدمات',
    'support', 'الدعم',
    'contactUs', 'تواصل معنا',
    'rights', 'جميع الحقوق محفوظة',
    'privacy', 'سياسة الخصوصية',
    'terms', 'شروط الاستخدام',
    'newsletterTitle', 'ابقَ على اطلاع',
    'newsletterDesc', 'احصل على آخر أخبار وتحديثات الذكاء الاصطناعي',
    'newsletterPlaceholder', 'أدخل بريدك الإلكتروني',
    'newsletterCta', 'اشترك'
  ), jsonb_build_object(
    'tagline', 'Build smarter, grow faster.',
    'quickLinks', 'Quick Links',
    'services', 'Services',
    'support', 'Support',
    'contactUs', 'Contact Us',
    'rights', 'All rights reserved',
    'privacy', 'Privacy Policy',
    'terms', 'Terms of Service',
    'newsletterTitle', 'Stay Updated',
    'newsletterDesc', 'Get the latest AI news and updates',
    'newsletterPlaceholder', 'Enter your email',
    'newsletterCta', 'Subscribe'
  ))
on conflict (key) do nothing;