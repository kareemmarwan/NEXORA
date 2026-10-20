const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 720, height: 311 }, colorScheme: 'dark' });
  await page.goto('http://localhost:3000/ar', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(2000);
  const data = await page.evaluate(() => {
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
    };
    const h1 = document.querySelector('h1');
    const h1Style = h1 ? getComputedStyle(h1) : null;
    return {
      header: r('header'),
      headerInner: r('header > div'),
      nav: r('header nav'),
      navGetStarted: r('header nav + div a[href*="register"]'),
      heroSection: r('main section'),
      heroContainer: r('main section > div.relative.z-10'),
      h1: r('h1'),
      h1Font: h1Style ? { size: h1Style.fontSize, family: h1Style.fontFamily.slice(0, 60), weight: h1Style.fontWeight, lh: h1Style.lineHeight } : null,
      desc: r('h1 + p'),
      btns: r('h1 + p + div'),
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
