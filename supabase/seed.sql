-- ============================================================
-- Seed data — EDITABLE
-- NOTE: All prices below are PLACEHOLDERS for demonstration.
-- Edit them to your real prices before going live.
-- Safe to re-run: rows are upserted by slug / label.
-- ============================================================

-- ---------- Categories ----------
insert into public.categories (slug, name_ar, name_en, description_ar, description_en, icon, sort_order, is_active)
values
  ('whatsapp-messaging', 'واتساب والمراسلة', 'WhatsApp & Messaging', 'ردود تلقائية على واتساب وإنستغرام وتيليغرام لخدمة عملائك أسرع.', 'Auto-replies on WhatsApp, Instagram and Telegram to serve customers faster.', 'message-circle', 1, true),
  ('ai-agents', 'الوكلاء الأذكياء', 'AI Agents', 'وكلاء ذكاء اصطناعي للدعم والمبيعات وخدمة الزوار على موقعك.', 'AI agents for support, sales and website visitors.', 'bot', 2, true),
  ('content-design', 'المحتوى والتصميم', 'Content & Design Agents', 'وكيل محتوى لمنصات التواصل وحزم تصميم متوافقة مع هويتك.', 'Social content agent and brand-consistent design packs.', 'sparkles', 3, true),
  ('marketing', 'التسويق', 'Marketing', 'أتمتة التسويق وأفكار الحملات الإعلانية ونصوصها.', 'Marketing automation, campaign ideas and ad copy.', 'megaphone', 4, true),
  ('automation', 'الأتمتة (n8n/Make)', 'Automation (n8n/Make)', 'ربط أنظمتك وأتمتة الطلبات والفواتير والتذكيرات.', 'Connect your stack — orders, invoices and reminders on autopilot.', 'workflow', 5, true),
  ('custom', 'حلول مخصصة', 'Custom Solutions', 'وكيل ذكاء اصطناعي مبني حسب مواصفاتك بالضبط.', 'An AI agent built exactly to your specification.', 'code', 6, true)
on conflict (slug) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

-- ---------- Services ----------
with cat as (
  select slug, id from public.categories
)
insert into public.services (
  slug, category_id, title_ar, title_en,
  short_desc_ar, short_desc_en,
  description_ar, description_en,
  price, currency, price_type, delivery_days, revisions,
  features_ar, features_en, requirements_ar, requirements_en, faqs,
  is_featured, is_active, sort_order
)
select
  s.slug,
  cat.id,
  s.title_ar, s.title_en,
  s.short_desc_ar, s.short_desc_en,
  s.description_ar, s.description_en,
  s.price, 'USD', s.price_type::public.price_type, s.delivery_days, s.revisions,
  s.features_ar::jsonb, s.features_en::jsonb, s.requirements_ar::jsonb, s.requirements_en::jsonb, s.faqs::jsonb,
  s.is_featured, true, s.sort_order
from (values
  -- 1. WhatsApp auto-reply bot
  ('whatsapp-auto-reply-bot', 'whatsapp-messaging',
    'روبوت ردود تلقائية على واتساب لأعمالك', 'WhatsApp Auto-Reply Bot for Business',
    'رد فوري على عملائك على واتساب على مدار الساعة مع تحويل المحادثات لفريقك عند الحاجة.',
    'Instant WhatsApp replies around the clock, with smart handoff to your team.',
    E'# روبوت واتساب الذكي لخدمة عملائك\n\nييجنت موظفين يرد على عملائك على واتساب فوراً: يستقبل الرسائل، يجيب على الأسئلة الشائعة، يلتقط بيانات العميل (الاسم، الطلب، رقم التواصل) ويحوّل المحادثة لفريقك عندما تحتاج تدخلاً بشرياً.\n\n## كيف يعمل؟\n- يرد خلال ثوانٍ على أي رسالة واردة\n- يفهم اللهجة العربية والإنجليزية\n- يسجّل بيانات العملاء المحتملين تلقائياً\n- يعمل 24/7 دون انقطاع\n\n## ماذا تستلم؟\n- روبوت جاهز على رقم واتساب أعمالك\n- لوحة ردود قابلة للتعديل (نصوص، أسئلة شائعة)\n- تقرير أسبوعي بأهم الأسئلة والعملاء المحتملين\n- شرح استخدام ودعم لمدة شهر',
    E'# WhatsApp bot for customer service\n\nYour AI teammate replies to customers on WhatsApp instantly: handles incoming messages, answers FAQs, captures lead details (name, request, contact) and hands off to your team when a human is needed.\n\n## How it works\n- Replies within seconds to any message\n- Understands Arabic dialects and English\n- Captures leads automatically\n- Works 24/7\n\n## What you get\n- A ready bot on your WhatsApp Business number\n- Editable reply board (texts, FAQs)\n- Weekly report with top questions and leads\n- Usage guide + 1 month of support',
    150, 'one_time', 5, 2,
    '["ردود تلقائية على الرسائل الواردة", "كتالوج أسئلة شائعة قابل للتعديل", "استخراج بيانات العملاء المحتملين", "تحويل المحادثة لفريقك عند الحاجة", "تقرير أسبوعي", "دعم لمدة شهر بعد التسليم"]',
    '["Auto-replies to incoming messages", "Editable FAQ catalog", "Lead capture", "Human handoff to your team", "Weekly report", "1 month of post-delivery support"]',
    '["رقم واتساب أعمال (واتساب بزنس)", "قائمة الأسئلة والأجوبة الشائعة", "معلومات عن منتجاتك/خدماتك وأسعارك", "من تريد أن تصلك المحادثات الحساسة"]',
    '["Your WhatsApp Business number", "List of FAQs", "Your products/services and prices", "Where sensitive chats should be handed off"]',
    '[{"q_ar":"هل أحتاج رقم واتساب أعمال؟","a_ar":"نعم، رقم واتساب بزنس أو رقم عادي مع واتساب. نساعدك في الإعداد.","q_en":"Do I need WhatsApp Business?","a_en":"Yes — WhatsApp Business or a regular number with WhatsApp. We help you set it up."},{"q_ar":"هل يتوقف الرد التلقائي عن العمل أحياناً؟","a_ar":"الروبوت يعمل على خوادم موثوقة مع مراقبة مستمرة، ونعيد تشغيله مجاناً خلال فترة الدعم.","q_en":"Can the bot go offline?","a_en":"It runs on monitored reliable servers, and we restart it for free during the support period."}]',
    true, 1),

  -- 2. Instagram DM auto-reply
  ('instagram-dm-auto-reply', 'whatsapp-messaging',
    'رد تلقائي على رسائل إنستغرام', 'Instagram DM Auto-Reply',
    'ردود فورية على رسائل إنستغرام والتعليقات لتلتقط كل عميل مهتم قبل أن يضيع.',
    'Instant replies to Instagram DMs and comments — never lose an interested customer.',
    E'# وكيل إنستغرام للرد التلقائي\n\nييجنت موظفين يرد على الرسائل المباشرة والتعليقات على إنستغرام: يجيب على الأسئلة الشائعة، يوجه العميل لصفحة الطلب أو رابط الدفع، ويجمع قائمة العملاء المهتمين.\n\n## المميزات الرئيسية\n- رد تلقائي فوري على الرسائل والتعليقات\n- ردود مخصصة حسب الكلمات المفتاحية\n- توجيه للعملاء للروابط والطلبات\n- ملخص أسبوعي بالعملاء المهتمين',
    E'# Instagram auto-reply agent\n\nYour AI teammate replies to DMs and comments on Instagram: answers FAQs, directs customers to your order or payment link, and collects interested leads.\n\n## Highlights\n- Instant auto-replies to DMs and comments\n- Keyword-based custom replies\n- Drives customers to links and orders\n- Weekly summary of interested leads',
    120, 'one_time', 4, 2,
    '["رد تلقائي على الرسائل المباشرة", "ردود على التعليقات العامة", "ردود بالكلمات المفتاحية", "روابط الطلب والدفع", "ملخص أسبوعي"]',
    '["Auto-replies to DMs", "Comment replies", "Keyword-based replies", "Order & payment links", "Weekly summary"]',
    '["حساب إنستغرام (أعمال أو منشئ)", "صلاحيات الدخول أو ربط الحساب", "قائمة الأسئلة الشائعة", "روابط الطلب/الدفع"]',
    '["Instagram account (business or creator)", "Login access or account linking", "FAQ list", "Order/payment links"]',
    '[{"q_ar":"هل يعمل مع الحسابات الشخصية؟","a_ar":"الأفضل حساب أعمال أو منشئ محتوى للحصول على كامل المميزات.","q_en":"Does it work with personal accounts?","a_en":"A business or creator account unlocks the full features."}]',
    false, 2),

  -- 3. Telegram support bot
  ('telegram-support-bot', 'whatsapp-messaging',
    'بوت دعم على تيليغرام', 'Telegram Support Bot',
    'بوت تيليغرام يرد على استفسارات عملائك ويحوّلهم لفريق الدعم عند الحاجة.',
    'A Telegram bot that answers customer questions and routes them to support.',
    E'# بوت دعم تيليغرام\n\nبوت ذكي على تيليغرام لخدمة عملائك: يرد على الأسئلة الشائعة، يدعم الأوامر (/start، /help، /order)، ويحوّل المحادثة لفريقك.\n\n## المميزات\n- ردود فورية بالعربية والإنجليزية\n- أزرار وأوامر تفاعلية\n- توجيه للفريق البشري\n- لوحة إحصاءات بسيطة',
    E'# Telegram support bot\n\nA smart Telegram bot for customer service: answers FAQs, supports commands (/start, /help, /order) and hands off to your team.\n\n## Features\n- Instant replies in Arabic and English\n- Interactive buttons and commands\n- Human handoff\n- Simple analytics dashboard',
    100, 'one_time', 3, 2,
    '["ردود فورية", "أوامر وأزرار تفاعلية", "تحويل للفريق البشري", "إحصاءات استخدام", "دعم لمدة شهر"]',
    '["Instant replies", "Commands and buttons", "Human handoff", "Usage analytics", "1 month support"]',
    '["بوت تيليغرام (BotFather token)", "قائمة الأسئلة الشائعة", "قناة/مجموعة الدعم إن وجدت"]',
    '["Telegram bot token (BotFather)", "FAQ list", "Support channel/group if any"]',
    '[{"q_ar":"كم يستغرق الإعداد؟","a_ar":"غالباً يومان بعد استلام التوكن والأسئلة.","q_en":"How long is setup?","a_en":"Usually 2 days after we get the token and FAQs."}]',
    false, 3),

  -- 4. Customer support AI agent
  ('customer-support-ai-agent', 'ai-agents',
    'وكيل دعم عملاء ذكي (مدرب على أسئلتك)', 'Customer Support AI Agent',
    'وكيل ذكاء اصطناعي يدرب على أسئلتك وكتالوج منتجاتك ليجيب عملاءك بدقة.',
    'An AI agent trained on your FAQ and catalog to answer customers accurately.',
    E'# وكيل دعم مدرّب على نشاطك\n\nلا نعطيك روبوتاً جاهزاً للجميع، بل ندرّب وكيل ذكاء اصطناعي على أسئلة عملائك الحقيقية، ومنتجاتك، وسياساتك (الشحن، الاسترجاع، الأسعار).\n\n## آلية العمل\n1. نجمع قاعدة المعرفة: الأسئلة، الأجوبة، الكتالوج، السياسات\n2. نبني الوكيل ونختبره مع حالات حقيقية\n3. نربطه بقنواتك (الموقع، واتساب، البريد)\n4. نراقب الأداء أسبوعياً ونحسّن الإجابات\n\n## ماذا تستلم؟\n- وكيل دعم جاهز على القنوات المطلوبة\n- قاعدة معرفة منظمة وقابلة للتطوير\n- تقرير أداء شهري\n- تدريب لفريقك على الإدارة',
    E'# An agent trained on your business\n\nNot a generic bot — we train an AI agent on your real customer questions, products and policies (shipping, refunds, pricing).\n\n## Process\n1. Collect the knowledge base: Q&A, catalog, policies\n2. Build and test the agent with real cases\n3. Connect it to your channels (site, WhatsApp, email)\n4. Monitor weekly and improve answers\n\n## What you get\n- A ready agent on your chosen channels\n- An organized, extensible knowledge base\n- Monthly performance report\n- Team training on management',
    350, 'one_time', 8, 2,
    '["بناء قاعدة معرفة كاملة", "تدريب الوكيل على حالاتك الحقيقية", "ربط بقناتين على الأقل", "اختبارات جودة قبل التسليم", "تقرير أداء شهري", "دعم وتحسين لمدة شهر"]',
    '["Full knowledge base build", "Training on your real cases", "Connect to at least 2 channels", "Quality tests before delivery", "Monthly performance report", "1 month of support and tuning"]',
    '["أسئلة وأجوبة العملاء الشائعة (أو سجل محادثات)", "كتالوج المنتجات/الخدمات والأسعار", "سياسات الشحن والاسترجاع", "نظام الدخول للقنوات المطلوبة"]',
    '["Customer FAQs (or chat logs)", "Product/service catalog and prices", "Shipping and refund policies", "Access to the target channels"]',
    '[{"q_ar":"هل يفهم اللهجة الفلسطينية/الخليجية؟","a_ar":"نعم، يتم تدريبه على اللهجات المستهدفة في جمهورك.","q_en":"Does it understand Gulf/Levantine dialects?","a_en":"Yes — it is trained on the dialects your audience uses."},{"q_ar":"ماذا لو لم يعرف الإجابة؟","a_ar":"يعتذر بلطف ويحوّل العميل لفريقك مع ملخص للمحادثة.","q_en":"What if it doesn''t know the answer?","a_en":"It politely apologizes and hands off to your team with a chat summary."}]',
    true, 4),

  -- 5. Sales AI agent
  ('sales-ai-agent', 'ai-agents',
    'وكيل مبيعات ذكي يؤهل العملاء المحتملين', 'Sales AI Agent',
    'وكيل يجيب عن الأسعار، يؤهل العملاء المحتملين، ويسلمهم لفريق المبيعات جاهزين للإغلاق.',
    'Qualifies leads, answers pricing questions and hands sales-ready customers to your team.',
    E'# وكيل مبيعات يعمل كعضو في فريقك\n\nييجنت موظفين للمبيعات يتحدث مع عملائك المحتملين، يجمع احتياجاتهم وميزانيتهم، يجيب عن أسئلة الأسعار والباقات، وينقل العميل "الساخن" لفريقك فوراً.\n\n## ما يفعله\n- يسأل الأسئلة الصحيحة لاكتشاف الاحتياج\n- يقترح الباقة المناسبة وفق إجابات العميل\n- يحجز موعد مكالمة أو زيارة لفريقك\n- يرسل ملخصاً كاملاً لكل عميل محتمل',
    E'# A sales agent that works as a teammate\n\nA sales AI teammate that talks to prospects, collects needs and budget, answers pricing and plan questions, and passes hot leads to your team instantly.\n\n## What it does\n- Asks the right discovery questions\n- Suggests the right plan based on answers\n- Books a call or visit for your team\n- Sends a full summary per lead',
    400, 'one_time', 8, 2,
    '["اكتشاف الاحتياج وتقييم العميل", "إجابات الأسعار والباقات", "حجز مواعيد", "ملخص لكل عميل محتمل", "تسليم سلس لفريق المبيعات", "دعم وتحسين لمدة شهر"]',
    '["Lead discovery and qualification", "Pricing and plan answers", "Appointment booking", "Summary per lead", "Smooth handoff to sales", "1 month of support and tuning"]',
    '["عروض الأسعار والباقات الحالية", "أسئلة التأهيل التي تريدها", "آلية حجز المواعيد (تقويم/واتساب)", "فريق المبيعات المسؤول عن المتابعة"]',
    '["Current pricing and plans", "Your qualification questions", "Booking method (calendar/WhatsApp)", "Sales team responsible for follow-up"]',
    '[{"q_ar":"هل يستبدل فريق المبيعات؟","a_ar":"لا، هو يهيئ العملاء ويؤهلهم، والإغلاق يبقى بشرياً.","q_en":"Does it replace the sales team?","a_en":"No — it prepares and qualifies leads; closing stays human."}]',
    true, 5),

  -- 6. Website chat agent
  ('website-chat-agent', 'ai-agents',
    'وكيل محادثة لموقعك الإلكتروني', 'Website Chat Agent',
    'دردشة ذكية على موقعك تجيب الزوار، تجمع العملاء المحتملين، وتدعم بلغتهم.',
    'Smart website chat that answers visitors, captures leads and speaks their language.',
    E'# دردشة موقع ذكية\n\nنضيف واجهة دردشة أنيقة لموقعك (تتوافق مع هوية موقعك) مدعومة بوكلاء ذكاء اصطناعي مدربين على محتوى موقعك وأسئلتك الشائعة.\n\n## المميزات\n- تصميم متوافق مع هوية موقعك\n- إجابات من محتوى موقعك مباشرة\n- استخراج بيانات العملاء (البريد/الهاتف)\n- يعمل بالعربية والإنجليزية\n- تقارير عن أكثر الأسئلة',
    E'# Smart website chat\n\nWe add an elegant chat widget (matched to your brand) powered by AI agents trained on your site content and FAQs.\n\n## Features\n- Design matched to your brand\n- Answers sourced from your site content\n- Lead capture (email/phone)\n- Arabic and English\n- Reports on top questions',
    280, 'one_time', 6, 2,
    '["ودجت دردشة مخصص لهوية موقعك", "تدريب على محتوى موقعك", "استخراج بيانات التواصل", "دعم العربية والإنجليزية", "لوحة تقارير", "دعم لمدة شهر"]',
    '["Branded chat widget", "Training on your site content", "Contact capture", "Arabic and English", "Reporting dashboard", "1 month support"]',
    '["رابط موقعك", "الصفحات المهمة (منتجات، أسعار، تواصل)", "هوية العلامة (الألوان/الشعار)", "مكان عرض النماذج المطلوبة"]',
    '["Your website URL", "Key pages (products, pricing, contact)", "Brand colors/logo", "Where captured leads should go"]',
    '[{"q_ar":"هل يعمل مع ووردبريس؟","a_ar":"نعم، تركيب بسيط عبر كود مدمج أو إضافة.","q_en":"Does it work with WordPress?","a_en":"Yes — simple embed code or a plugin."}]',
    false, 6),

  -- 7. Social media content agent
  ('social-content-agent', 'content-design',
    'وكيل محتوى لمنصات التواصل الاجتماعي', 'Social Media Content Agent',
    'تقويم محتوى شهري، نصوص منشورات، وهاشتاقات متوافقة مع علامتك.',
    'Monthly content calendar, captions and hashtags aligned with your brand.',
    E'# وكيل محتوى شهري\n\nنجهّز لك تقويم محتوى جاهزاً لشهر كامل: أفكار منشورات، نصوص جذابة بالعربية، هاشتاقات مدروسة، واقتراحات فيديو قصيرة.\n\n## كيف يعمل؟\n- نحلل علامتك ومنافسيك\n- نبني تقويم محتوى شهرياً (20-30 فكرة)\n- نكتب النصوص والهاشتاقات\n- نسلّمك كل شيء بملف منظم + تقويم تخطيط\n\n## المدة والدعم\n- تسليم كل شهر قبل بدايته بـ 5 أيام\n- جولتا تعديل على المحتوى',
    E'# Monthly content agent\n\nWe prepare a full month content calendar: post ideas, engaging Arabic captions, researched hashtags and short-form video suggestions.\n\n## How it works\n- Analyze your brand and competitors\n- Build a monthly calendar (20-30 ideas)\n- Write captions and hashtags\n- Deliver in an organized file + planning calendar\n\n## Timing\n- Delivered 5 days before each month starts\n- 2 revision rounds',
    200, 'monthly', 5, 2,
    '["تقويم محتوى شهري (20-30 فكرة)", "نصوص منشورات جاهزة", "هاشتاقات مدروسة", "أفكار فيديوهات قصيرة", "ملف منظم قابل للتعديل", "جولتا تعديل"]',
    '["Monthly calendar (20-30 ideas)", "Ready post captions", "Researched hashtags", "Short video ideas", "Organized editable file", "2 revision rounds"]',
    '["معلومات عن علامتك وجمهورك", "منافسون تراهم مرجعية", "قناة النشر (إنستغرام/تيك توك/فيسبوك)", "أمثلة على منشورات أعجبتك"]',
    '["Brand and audience info", "Reference competitors", "Publishing channels", "Examples of posts you like"]',
    '[{"q_ar":"هل تصمم الصور أيضاً؟","a_ar":"المحتوى النصي مشمول، والتصميم يُطلب كخدمة منفصلة أو إضافة.","q_en":"Does it include design?","a_en":"Text content is included; design is a separate service or add-on."}]',
    true, 7),

  -- 8. Brand-consistent post design pack
  ('brand-design-pack', 'content-design',
    'حزمة تصميم منشورات متوافقة مع هويتك', 'Brand-Consistent Post Design Pack',
    '10 تصاميم منشورات جاهزة بنفس الهوية البصرية لعلامتك.',
    '10 ready post designs aligned with your visual brand identity.',
    E'# حزمة تصميم الشهر\n\n10 تصاميم منشورات جاهزة للنشر مصممة بنفس الهوية البصرية لعلامتك: ألوانك، خطوطك، شعارك.\n\n## ما تستلمه\n- 10 تصاميم (مربع/أفقي/ستوري)\n- ملفات PNG عالية الجودة + مصدر قابل للتعديل\n- جولة تعديل واحدة\n- التسليم خلال 5 أيام عمل',
    E'# Monthly design pack\n\n10 ready-to-publish post designs in your visual identity: your colors, fonts and logo.\n\n## What you get\n- 10 designs (square / landscape / story)\n- High-res PNGs + editable source\n- 1 revision round\n- Delivered in 5 business days',
    120, 'one_time', 5, 1,
    '["10 تصاميم منشورات", "مقاسات متعددة (مربع، ستوري)", "ملفات PNG + المصدر", "جولة تعديل واحدة"]',
    '["10 post designs", "Multiple sizes (square, story)", "PNG + source files", "1 revision round"]',
    '["الشعار بصيغة عالية الجودة", "ألوان العلامة والخطوط", "نصوص المنشورات المراد تصميمها", "أمثلة تصاميم تعجبك"]',
    '["High-quality logo", "Brand colors and fonts", "Post copy to design", "Design examples you like"]',
    '[{"q_ar":"هل أستطيع التعديل على التصاميم لاحقاً؟","a_ar":"نعم، نسلّمك ملفات المصدر قابلة للتعديل.","q_en":"Can I edit the designs later?","a_en":"Yes, you get editable source files."}]',
    false, 8),

  -- 9. Marketing automation
  ('marketing-automation', 'marketing',
    'أتمتة التسويق: من العميل المحتمل إلى المتابعة', 'Marketing Automation: Lead to Follow-up',
    'ربط نماذج الالتقاط بـ CRM ورسائل المتابعة التلقائية.',
    'Connect lead capture forms to a CRM and automated follow-ups.',
    E'# أتمتة تسويق متكاملة\n\nنبني لك مساراً تلقائياً: العميل يملأ النموذج ← يُضاف تلقائياً إلى نظام إدارة العملاء ← يستقبل سلسلة رسائل متابعة ← يصلك إشعار عند تفاعله.\n\n## المكونات\n- نماذج التقاط عملاء\n- ربط مع CRM أو جوجل شيت\n- سلاسل متابعة بالبريد/واتساب\n- إشعارات لفريقك\n- لوحة متابعة بسيطة',
    E'# Complete marketing automation\n\nWe build an automated flow: lead fills a form → added to your CRM → receives a follow-up sequence → your team gets notified on engagement.\n\n## Components\n- Lead capture forms\n- CRM or Google Sheets integration\n- Email/WhatsApp follow-up sequences\n- Team notifications\n- Simple tracking dashboard',
    300, 'one_time', 7, 2,
    '["نماذج التقاط عملاء", "ربط مع CRM أو جداول", "سلسلة متابعة تلقائية", "إشعارات فورية للفريق", "لوحة متابعة"]',
    '["Lead capture forms", "CRM/Sheets integration", "Automated follow-up sequence", "Instant team alerts", "Tracking dashboard"]',
    '["نظام إدارة العملاء المستخدم", "قناة التواصل (بريد/واتساب)", "نصوص رسائل المتابعة أو أفكارها", "الميزانية الإعلانية إن وجدت"]',
    '["Your CRM system", "Contact channel (email/WhatsApp)", "Follow-up message copy or ideas", "Ad budget if any"]',
    '[{"q_ar":"هل تعمل الأتمتة مع أنظمتي الحالية؟","a_ar":"نعم، ندعم معظم الأنظمة الشائعة وندعمك في الربط.","q_en":"Does it work with my current tools?","a_en":"Yes — we support most common tools and help you connect them."}]',
    false, 9),

  -- 10. Ad copy and campaign ideas
  ('ad-copy-agent', 'marketing',
    'وكيل نصوص إعلانية وأفكار حملات', 'Ad Copy & Campaign Ideas Agent',
    'نصوص إعلانية جاهزة وأفكار حملات لفيسبوك وإنستغرام وتيك توك.',
    'Ready ad copy and campaign ideas for Facebook, Instagram and TikTok.',
    E'# وكيل الحملات الإعلانية\n\nنجهّز لك حملة إعلانية كاملة على الورق: فكرة الحملة، الجمهور المستهدف، النصوص الإعلانية (3-5 نسخ)، الصور المقترحة، والميزانية الموصى بها.\n\n## ما تستلمه\n- 3 أفكار حملات كاملة\n- 15 نصاً إعلانياً جاهزًا\n- تقسيم الجمهور المستهدف\n- توصيات الميزانية\n- جولة تعديل',
    E'# Campaign agent\n\nWe prepare a complete ad campaign on paper: campaign idea, target audience, ad copy (3-5 variants), creative direction and recommended budget.\n\n## What you get\n- 3 complete campaign ideas\n- 15 ready ad copies\n- Audience segmentation\n- Budget recommendations\n- 1 revision round',
    90, 'one_time', 3, 1,
    '["3 أفكار حملات", "15 نصاً إعلانياً", "تقسيم الجمهور", "توصيات الميزانية", "جولة تعديل"]',
    '["3 campaign ideas", "15 ad copies", "Audience segmentation", "Budget advice", "1 revision round"]',
    '["نشاطك والمنتج المروج", "الجمهور المستهدف", "المنصات الإعلانية", "ميزانية الحملة التقريبية"]',
    '["Your business and promoted product", "Target audience", "Ad platforms", "Approximate campaign budget"]',
    '[{"q_ar":"هل تنشئون الحملات على حسابي؟","a_ar":"الخدمة تشمل التخطيط والنصوص، وإنشاء الحملة يُطلب كإضافة.","q_en":"Do you launch campaigns on my account?","a_en":"This service covers planning and copy; launching is an add-on."}]',
    false, 10),

  -- 11. Order-to-sheet/CRM automation
  ('orders-automation', 'automation',
    'أتمتة الطلبات: من الموقع إلى الجدول أو CRM', 'Orders Automation: Site to Sheet/CRM',
    'كل طلب يصل إلى جدولك أو نظامك تلقائياً مع إشعارات فورية.',
    'Every order lands in your sheet or CRM automatically with instant alerts.',
    E'# أتمتة دورة الطلبات\n\nنبني مساراً يأخذ الطلبات من موقعك أو متجرك ويضيفها تلقائياً إلى جوجل شيت أو CRM، مع إشعارات واتساب/بريد لفريقك، وحالات الطلب تتحدث تلقائياً.\n\n## المكونات\n- استقبال الطلبات (الموقع/المتجر/الواتساب)\n- إضافة تلقائية للجدول أو CRM\n- إشعارات فورية\n- تحديث حالة الطلب\n- معالجة الأخطاء وإعادة المحاولة',
    E'# Order flow automation\n\nWe build a flow that takes orders from your site or store and adds them to Google Sheets or a CRM, with WhatsApp/email alerts and automatic status updates.\n\n## Components\n- Order intake (site/store/WhatsApp)\n- Automatic push to Sheet/CRM\n- Instant alerts\n- Order status updates\n- Error handling and retries',
    250, 'one_time', 6, 2,
    '["ربط مصدر الطلبات", "إضافة تلقائية للجدول/CRM", "إشعارات الفريق", "تحديث الحالات", "معالجة الأخطاء"]',
    '["Connect order source", "Auto-push to Sheet/CRM", "Team alerts", "Status updates", "Error handling"]',
    '["مصدر الطلبات (موقع/متجر/واتساب)", "نظام الوجهة (جوجل شيت أو CRM)", "حقول البيانات المطلوبة", "إشعارات مين تصلك"]',
    '["Order source (site/store/WhatsApp)", "Destination (Google Sheet or CRM)", "Required data fields", "Who should be notified"]',
    '[{"q_ar":"كم طلباً تتحمل الأتمتة شهرياً؟","a_ar":"حسب الباقة، وعادة تكفي الباقة القياسية لمئات الطلبات.","q_en":"How many orders per month?","a_en":"Depends on the plan — the standard one fits hundreds of orders."}]',
    true, 11),

  -- 12. Invoice and reminder automation
  ('invoice-reminder-automation', 'automation',
    'أتمتة الفواتير والتذكيرات', 'Invoice & Reminder Automation',
    'فواتير تُنشأ تلقائياً وتذكيرات دفع ذكية تقلل التأخير.',
    'Auto-generated invoices and smart payment reminders that reduce late payments.',
    E'# الفواتير والتذكيرات على التلقائي\n\nننشئ لك نظاماً يصدر الفواتير تلقائياً عند اكتمال الطلب أو الشهر، ويرسل تذكيرات دفع ذكية قبل وبعد الاستحقاق، مع ملخص شهري للمبالغ المستحقة.\n\n## المميزات\n- إصدار تلقائي للفواتير (PDF)\n- تذكيرات قبل/يوم/بعد الاستحقاق\n- ملخص شهري للمستحقات\n- ربط مع جداولك أو CRM',
    E'# Invoices and reminders on autopilot\n\nWe build a system that issues invoices automatically when an order or month completes, sends smart reminders before and after due dates, and provides a monthly receivables summary.\n\n## Features\n- Auto invoice generation (PDF)\n- Reminders before/on/after due date\n- Monthly receivables summary\n- Integrates with your sheets or CRM',
    180, 'one_time', 5, 2,
    '["إصدار الفواتير تلقائياً", "تذكيرات ذكية متعددة", "ملخص شهري للمستحقات", "ربط مع أنظمتك"]',
    '["Auto invoice generation", "Smart multi-stage reminders", "Monthly receivables summary", "Integrations"]',
    '["قالب الفاتورة الحالي", "بيانات العملاء", "مواعيد الاستحقاق المعتادة", "قناة إرسال التذكيرات"]',
    '["Your invoice template", "Customer data", "Usual due dates", "Reminder channel"]',
    '[{"q_ar":"هل تدعم الفواتير بالعربية؟","a_ar":"نعم، القوالب ثنائية اللغة حسب حاجتك.","q_en":"Are Arabic invoices supported?","a_en":"Yes — templates are bilingual as needed."}]',
    false, 12),

  -- 13. Custom AI agent
  ('custom-ai-agent', 'custom',
    'وكيل ذكاء اصطناعي مخصص حسب مواصفاتك', 'Custom AI Agent (Quote-based)',
    'فكرة خاصة؟ نبني لك وكيلاً مخصصاً بالمواصفات التي تحتاجها بالضبط.',
    'A unique idea? We build a custom agent to your exact specification.',
    E'# وكيل مخصص بالكامل\n\nعندما لا تجد ما تحتاجه في الكتالوج، نبني لك حلاً مخصصاً: من تحديد المتطلبات، إلى التصميم، البناء، الاختبار، والتسليم.\n\n## كيف نبدأ؟\n1. مكالمة قصيرة لفهم الفكرة\n2. عرض سعر ونطاق عمل واضح\n3. بناء على مراحل مع مراجعات\n4. تسليم مع توثيق وتدريب\n\n## السعر\nيبدأ من 500 دولار ويُحدد حسب النطاق.',
    E'# Fully custom agent\n\nWhen the catalog doesn''t cover your need, we build a custom solution: requirements, design, build, test and delivery.\n\n## How we start\n1. A short call to understand the idea\n2. A quote with clear scope\n3. Build in stages with reviews\n4. Delivery with docs and training\n\n## Pricing\nStarting from $500, scoped per project.',
    500, 'one_time', 15, 3,
    '["تحليل المتطلبات", "تصميم الحل", "البناء على مراحل", "اختبارات وتسليم", "توثيق وتدريب", "دعم بعد التسليم"]',
    '["Requirements analysis", "Solution design", "Staged build", "Testing and delivery", "Docs and training", "Post-delivery support"]',
    '["وصف الفكرة والمشكلة", "الأنظمة المطلوب ربطها", "الميزانية التقريبية", "الموعد المطلوب للتسليم"]',
    '["Idea and problem description", "Systems to integrate", "Approximate budget", "Required delivery date"]',
    '[{"q_ar":"هل يمكن البدء بمرحلة تجريبية؟","a_ar":"نعم، ندعم البناء على مراحل مع تسليم جزئي.","q_en":"Can we start with a pilot?","a_en":"Yes — staged delivery is supported."}]',
    false, 13)
) as s(slug, category_slug, title_ar, title_en, short_desc_ar, short_desc_en,
       description_ar, description_en, price, price_type, delivery_days, revisions,
       features_ar, features_en, requirements_ar, requirements_en, faqs,
       is_featured, sort_order)
join cat on cat.slug = s.category_slug
on conflict (slug) do update set
  category_id = excluded.category_id,
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  price = excluded.price,
  price_type = excluded.price_type,
  delivery_days = excluded.delivery_days,
  revisions = excluded.revisions,
  features_ar = excluded.features_ar,
  features_en = excluded.features_en,
  requirements_ar = excluded.requirements_ar,
  requirements_en = excluded.requirements_en,
  faqs = excluded.faqs,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order;

-- ---------- Add-ons ----------
-- NOTE: add-on prices are PLACEHOLDERS — edit before launch.
insert into public.service_addons (service_id, title_ar, title_en, price, extra_days, is_active)
select s.id, a.title_ar, a.title_en, a.price, a.extra_days, true
from (values
  ('whatsapp-auto-reply-bot', 'ربط 3 ردود إضافية (أوامر متقدمة)', '3 extra reply flows (advanced commands)', 40, 1),
  ('whatsapp-auto-reply-bot', 'دعم أولوية لمدة 3 أشهر', '3 months priority support', 60, 0),
  ('customer-support-ai-agent', 'تدريب على 50 سؤالاً إضافياً', 'Training on 50 extra questions', 80, 2),
  ('customer-support-ai-agent', 'ربط قناة إضافية (بريد/تيليغرام)', 'Extra channel (email/Telegram)', 70, 2),
  ('sales-ai-agent', 'ربط مع نظام CRM', 'CRM integration', 90, 2),
  ('website-chat-agent', 'تصميم ودجت مخصص بالكامل', 'Fully custom widget design', 60, 2),
  ('social-content-agent', 'تصميم 10 منشورات إضافية', '10 extra post designs', 100, 3),
  ('brand-design-pack', '5 تصاميم إضافية', '5 extra designs', 50, 2),
  ('marketing-automation', 'سلاسل متابعة إضافية (5 رسائل)', 'Extra follow-up sequence (5 messages)', 60, 2),
  ('custom-ai-agent', 'مرحلة تجريبية أولى', 'Initial pilot phase', 250, 5)
) as a(service_slug, title_ar, title_en, price, extra_days)
join public.services s on s.slug = a.service_slug
where not exists (
  select 1 from public.service_addons existing
  where existing.service_id = s.id and existing.title_en = a.title_en
);

-- ---------- Payment methods ----------
-- NOTE: replace the details below with your real bank / wallet information.
insert into public.payment_methods (type, label_ar, label_en, details_ar, details_en, is_active, sort_order)
values
  ('manual', 'تحويل بنكي', 'Bank transfer',
   E'**بنك فلسطين**\nاسم الحساب: اسم شركتك\nرقم الحساب: 0000-0000-0000-0000\nIBAN: PS00 0000 0000 0000 0000 0000 0000\n\nيرجى إرسال صورة إيصال التحويل من صفحة الطلب.',
   E'**Bank of Palestine**\nAccount name: Your Company\nAccount number: 0000-0000-0000-0000\nIBAN: PS00 0000 0000 0000 0000 0000 0000\n\nPlease upload a transfer receipt from the order page.',
   true, 1),
  ('manual', 'محفظة إلكترونية (جوال)', 'Mobile wallet',
   E'**محفظة جوال / إم تي إن**\nرقم المحفظة: 0599 000 000\nاسم المستلم: اسم شركتك\n\nأرسل صورة إثبات التحويل من صفحة الطلب.',
   E'**Mobile wallet**\nWallet number: 0599 000 000\nRecipient: Your Company\n\nUpload the transfer proof from the order page.',
   true, 2),
  ('manual', 'دفع نقدي في المكتب', 'Cash / office',
   E'**الدفع النقدي**\nيمكنك زيارة مكتبنا ودفع المبلغ نقداً واستلام فاتورة.\nالعنوان: غزة، فلسطين\nالدوام: 9 صباحاً - 5 مساءً',
   E'**Cash payment**\nVisit our office to pay in cash and receive a receipt.\nAddress: Gaza, Palestine\nHours: 9 AM - 5 PM',
   true, 3)
on conflict do nothing;
