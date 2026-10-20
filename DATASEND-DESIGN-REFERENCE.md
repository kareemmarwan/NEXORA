# NEXORA — DataSend.ai Design System Reference
# خطة التنفيذ الم分期ة (Phased Implementation Plan)

> هذا المستند يحلل تصميم DataSend.ai ويقسمه إلى مهام قابلة للتنفيذ على مراحل
> لتطبيق نفس الأسلوب على مشروع NEXORA (منصة خدمات AI)

---

## 📋 ملخص التحليل — DataSend.ai

### الهوية البصرية العامة
- **الأسلوب**: Dark futuristic / Web3 / SaaS premium
- **الخلفية الرئيسية**: `#04080f` (أزرق-أسود عميق جداً)
- **لون النص الأساسي**: `#8899aa` (رمادي-أزرق خافت)
- **لون التمييز الرئيسي**: `#3b82f6` (أزرق vivid)
- **التأثيرات**: Glass morphism، gradient borders، noise texture، shimmer text
- **الأنيميشن**: Fade-up reveals، hover lifts، ticker marquee، shimmer gradients

---

## 📐 المرحلة 1 — النظام اللوني (Color System)

### 1.1 الخلفيات
| العنصر | القيمة | الوصف |
|--------|--------|-------|
| Background Primary | `#04080f` | أساسي للصفحة كاملة |
| Background Card | `#070d1a` | خلفية البطاقات |
| Background Elevated | `#0a1128` | خلفية عناصر مرتفعة |
| Background Muted | `rgba(255,255,255,0.02)` | خلفيات شبه شفافة |

### 1.2 النصوص
| العنصر | القيمة | الاستخدام |
|--------|--------|----------|
| Text Primary | `#e2e8f0` | العناوين الرئيسية |
| Text Secondary | `#8899aa` | النصوص الفرعية |
| Text Muted | `#4a5568` | نصوص ثانوية جداً |
| Text White | `#ffffff` | على خلفيات داكنة |

### 1.3 التمييز (Accents)
| العنصر | القيمة | الاستخدام |
|--------|--------|----------|
| Blue Primary | `#3b82f6` | الأزرار، الروابط، التمييز |
| Blue Dark | `#1d4ed8` | تدرجات الأزرار |
| Indigo | `#4338ca` | تدرجات الأزرار |
| Cyan | `#22d3ee` | تأثيرات shimmer |
| Purple | `#a78bfa` | تدرجات shimmer |
| Green | `#10b981` | نجاح، أسعار |
| Red | `#ef4444` | تحذيرات |

### 1.4 التدرجات (Gradients)
```css
/* Shimmer Text */
--shimmer: linear-gradient(90deg, #3b82f6, #22d3ee, #a78bfa, #3b82f6, #22d3ee);

/* Button Gradient */
--btn-gradient: linear-gradient(135deg, #1d4ed8, #4338ca);

/* Border Gradient */
--border-gradient: linear-gradient(135deg, rgba(59,130,246,.4), rgba(6,182,212,.15), rgba(139,92,246,.25));

/* Hero Glow */
--hero-glow: radial-gradient(circle, rgba(59,130,246,.15), transparent 60%);
```

### 1.5 المهام
- [ ] تحديث `globals.css` بنظام الألوان الجديد
- [ ] تحديث CSS variables في `:root` و `.dark`
- [ ] تحديث `tailwind.config.ts` colors
- [ ] إضافة تدرجات shimmer و border gradients
- [ ] تحديث ألوان الأزرار والبطاقات

---

## ✍️ المرحلة 2 — نظام الخطوط (Typography)

### 2.1 الخطوط المستخدمة في DataSend.ai
| الخط | الاستخدام | الأوزان |
|------|----------|---------|
| **DM Sans** | أساسي (body + headings) | 300–900 |
| **JetBrains Mono** | أكواد، أرقام، labels | 400–700 |

### 2.2 خطة NEXORA (مطبقة جزئياً)
| الخط | CSS Variable | الاستخدام |
|------|-------------|----------|
| **Space Grotesk** | `--font-brand` | NEXORA wordmark فقط |
| **Inter** | `--font-english` | النصوص الإنجليزية |
| **Cairo** | `--font-arabic` | النصوص العربية |

### 2.3 أحجام الخطوط (DataSend.ai)
| العنصر | الحجم | الوزن | Letter-spacing |
|--------|-------|-------|----------------|
| Hero Title | `clamp(42px, 7vw, 84px)` | 800 | -0.03em |
| Section Title | `32px–48px` | 700 | -0.02em |
| Card Title | `20px–24px` | 600 | -0.01em |
| Body | `15px–16px` | 400 | -0.02em |
| Small/Label | `13px–14px` | 500 | 0 |
| Mono/Numbers | `13px–14px` | 500 | 0.02em |

### 2.4 المهام
- [ ] التأكد من تحميل Space Grotesk, Inter, Cairo بشكل صحيح
- [ ] مراجعة أحجام العناوين في كل الصفحات
- [ ] تطبيق `letter-spacing: -0.02em` على العناوين الإنجليزية
- [ ] إضافة `font-mono` للأرقام والـ labels التقنية
- [ ] مراجعة الخطوط في الوضع RTL

---

## 🏗️ المرحلة 3 — البنية العامة (Layout Structure)

### 3.1 هيكل الصفحة في DataSend.ai
```
┌─────────────────────────────────────────┐
│  Navbar (sticky, glass, dark)           │
├─────────────────────────────────────────┤
│  Hero Section                           │
│  ├── Badge (LIVE indicator)             │
│  ├── Title (large, shimmer)             │
│  ├── Subtitle                           │
│  ├── CTA Buttons (2)                    │
│  └── Trust indicators                   │
├─────────────────────────────────────────┤
│  Stats/Metrics Bar (animated counters)  │
├─────────────────────────────────────────┤
│  App Mockup/Screenshot                  │
├─────────────────────────────────────────┤
│  Problem → Solution (2 column)          │
├─────────────────────────────────────────┤
│  Data Quality Comparison Table          │
├─────────────────────────────────────────┤
│  Feature Cards Grid (3 cols)            │
├─────────────────────────────────────────┤
│  Platform Features (tabs + preview)     │
├─────────────────────────────────────────┤
│  How it Works (3 steps)                 │
├─────────────────────────────────────────┤
│  Social Proof / Metrics                 │
├─────────────────────────────────────────┤
│  Pricing (3 tiers)                      │
├─────────────────────────────────────────┤
│  FAQ (accordion)                        │
├─────────────────────────────────────────┤
│  Contact Form                           │
├─────────────────────────────────────────┤
│  Final CTA                              │
├─────────────────────────────────────────┤
│  Footer                                 │
└─────────────────────────────────────────┘
```

### 3.2 Container Widths
| Breakpoint | Width | Padding |
|------------|-------|---------|
| Default | `100%` | `16px` |
| sm (640px) | `640px` | `20px` |
| md (768px) | `768px` | `24px` |
| lg (1024px) | `1024px` | `32px` |
| xl (1280px) | `1200px` | `32px` |

### 3.3 المهام
- [ ] مراجعة هيكل الصفحة الرئيسية في NEXORA
- [ ] إضافة قسم Stats/Metrics بعد Hero
- [ ] إضافة قسم Problem → Solution
- [ ] إضافة قسم Data Quality (مقارنة)
- [ ] مراجعة ترتيب الأقسام الموجودة
- [ ] تحسين spacing بين الأقسام

---

## 🎴 المرحلة 4 — البطاقات والمكونات (Cards & Components)

### 4.1 بطاقة الميزات (Feature Card)
```css
.feature-card {
  background: #070d1a;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 28px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.feature-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}
```

### 4.2 بطاقة الإحصائيات (Metric Card)
```css
.metric-card {
  background: #070d1a;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}
.metric-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--accent);
  opacity: 0.6;
}
```

### 4.3 الأزرار (Buttons)
```css
/* Primary Button */
.btn {
  background: linear-gradient(135deg, #1d4ed8, #4338ca);
  border-radius: 12px;
  padding: 12px 28px;
  font-weight: 700;
  font-size: 15px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59,130,246,0.4);
}

/* Outline Button */
.btn-outline {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  color: #e2e8f0;
}
.btn-outline:hover {
  border-color: rgba(59,130,246,0.4);
  background: rgba(59,130,246,0.05);
}
```

### 4.4 Border Gradient Effect
```css
.gborder {
  background: linear-gradient(#070d1a, #070d1a) padding-box,
              linear-gradient(135deg, rgba(59,130,246,.4), rgba(6,182,212,.15), rgba(139,92,246,.25)) border-box;
  border: 1px solid transparent;
}
```

### 4.5 المهام
- [ ] تحديث مكون `Card` بتصميم DataSend
- [ ] تحديث مكون `Button` بنظام الألوان الجديد
- [ ] إضافة تأثير `gborder` كـ CSS component
- [ ] تحديث `ServiceCard` بالتأثيرات الجديدة
- [ ] تحديث `Badge` component
- [ ] إضافة `metric-card` component جديد

---

## 🎬 المرحلة 5 — الأنيميشن والتأثيرات (Animations & Effects)

### 5.1 الأنيميشن الأساسية
```css
/* Fade Up - للعناصر تظهر عند التمرير */
@keyframes fu {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Fade In */
@keyframes fi {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Shimmer Text - نص متدرج متحرك */
@keyframes shimmer {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

/* Ticker - شريط متحرك */
@keyframes ticker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Glow Pulse */
@keyframes glow {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.65; }
}
```

### 5.2 تأثيرات التمرير (Scroll Reveal)
```css
.section-in {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.7s cubic-bezier(.16,1,.3,1),
              transform 0.7s cubic-bezier(.16,1,.3,1);
}
.section-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 5.3 Noise Texture Overlay
```css
.noise {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  opacity: 0.022;
  background-image: url("data:image/svg+xml,...");
  background-size: 256px;
}
```

### 5.4 المهام
- [ ] إضافة noise texture overlay
- [ ] تحسين scroll reveal animations
- [ ] إضافة shimmer text effect
- [ ] إضافة ticker/marquee component
- [ ] مراجعة جميع الأنيميشن الموجودة
- [ ] التأكد من `prefers-reduced-motion`

---

## 🧭 المرحلة 6 — شريط التنقل (Navbar)

### 6.1 تصميم DataSend Navbar
- خلفية داكنة شفافة مع `backdrop-filter: blur()`
- ارتفاع ثابت (~64px)
- Logo على اليسار
- روابط التنقل في المنتصف
- أزرار Login/Sign up على اليمين
- Language switcher (flags)
- Mobile: hamburger menu

### 6.2 تحسينات NEXORA المطلوبة
- [ ] تطبيق `font-brand` (Space Grotesk) على NEXORA wordmark
- [ ] تنظيف hover effects على الروابط
- [ ] إضافة active indicator (underline أو dot)
- [ ] تحسين mobile menu animation
- [ ] إضافة scroll-aware background (مطبقة جزئياً)
- [ ] تناسق spacing بين العناصر

---

## 📊 المرحلة 7 — قسم Hero

### 7.1 عناصر Hero في DataSend
1. **Badge**: `LIVE · 12.5M+ European companies · 7 countries`
2. **Title**: كبير جداً مع shimmer effect
3. **Subtitle**: وصف مختصر
4. **CTA**: زر رئيسي + زر ثانوي
5. **Trust**: "No credit card · GDPR compliant · Cancel anytime"
6. **Mockup**: صورة التطبيق (اختياري)

### 7.2 تحسينات NEXORA Hero
- [ ] تحسين حجم العنوان `clamp()`
- [ ] إضافة shimmer text على العنوان
- [ ] تحسين trust indicators
- [ ] إضافة animated badge (LIVE أو AI-POWERED)
- [ ] تحسين spacing و responsive
- [ ] إضافة mockup أو visual element

---

## 💰 المرحلة 8 — قسم التسعير (Pricing)

### 8.1 تصميم DataSend Pricing
- 3-4 صفوف (Free, Freelancer, Founder, Enterprise)
- بطاقة "MOST POPULAR" مميزة
- عملات متعددة (EUR/USD/CZK/PLN/HUF/CHF)
- Toggle للعملات
- ميزات واضحة لكل خطة
- زر CTA لكل خطة

### 8.2 تحسينات NEXORA Pricing
- [ ] مراجعة تصميم بطاقات التسعير
- [ ] إضافة badge "الأكثر شعبية"
- [ ] تحسين المقارنة بين الخطط
- [ ] تحسين responsive layout

---

## ❓ المرحلة 9 — قسم FAQ

### 9.1 تصميم DataSend FAQ
- Accordion style
- أسئلة مختصرة
- إجابات واضحة ومباشرة
- تصميم نظيف مع borders

### 9.2 تحسينات NEXORA FAQ
- [ ] مراجعة تصميم الـ Accordion
- [ ] تحسين الأسئلة الشائعة حسب المشروع
- [ ] إضافة animation عند الفتح/الإغلاق

---

## 📱 المرحلة 10 — التجاوب (Responsive)

### 10.1 نقاط التوقف في DataSend
| Breakpoint | التغييرات |
|------------|----------|
| `< 420px` | عمود واحد، تصغير عناوين |
| `< 768px` | عمود واحد للميزات، إخفاء عناصر |
| `< 1024px` | إخفاء navbar desktop، إظهار hamburger |
| `≥ 1024px` | عرض كامل |

### 10.2 المهام
- [ ] اختبار جميع الصفحات على mobile
- [ ] التأكد من عدم وجود horizontal overflow
- [ ] مراجعة أحجام الخطوط على mobile
- [ ] تحسين touch targets (44px minimum)
- [ ] مراجعة RTL على mobile

---

## 📋 ملخص المهام حسب الأولوية

### 🔴 عالية الأولوية (المرحلة 1-2)
1. تحديث نظام الألوان الكامل
2. تحديث نظام الخطوط
3. تحسين Hero section
4. تحديث الأزرار والبطاقات

### 🟡 متوسطة الأولوية (المرحلة 3-5)
5. إضافة أقسام جديدة (Stats, Problem→Solution)
6. تحسين الأنيميشن
7. تحسين Navbar
8. تحسين Pricing section

### 🟢 منخفضة الأولوية (المرحلة 6-10)
9. إضافة noise texture
10. تحسين FAQ
11. إضافة ticker/marquee
12. تحسينات responsive تفصيلية

---

## 📁 الملفات الرئيسية للمراجعة

| الملف | الوصف |
|-------|-------|
| `src/app/globals.css` | الألوان، الخطوط، التأثيرات |
| `tailwind.config.ts` | إعدادات Tailwind |
| `src/app/[locale]/layout.tsx` | تحميل الخطوط |
| `src/app/[locale]/(public)/page.tsx` | الصفحة الرئيسية |
| `src/components/layout/header.tsx` | شريط التنقل |
| `src/components/layout/footer.tsx` | التذييل |
| `src/components/ui/button.tsx` | الأزرار |
| `src/components/ui/badge.tsx` | الشارات |
| `src/components/ui/card.tsx` | البطاقات |
| `src/components/ui/accordion.tsx` | الأكورديون |
| `src/components/services/service-card.tsx` | بطاقة الخدمة |
| `src/components/brand/logo.tsx` | الشعار |

---

> **ملاحظة**: هذا المستند مرجع للتنفيذ. كل مرحلة يجب تنفيذها واختبارها بشكل منفصل قبل الانتقال للتالية.