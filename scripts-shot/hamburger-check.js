const { chromium } = require('@playwright/test');

(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu'] });
  const p = await b.newPage({ viewport: { width: 375, height: 812 }, colorScheme: 'dark' });
  await p.goto('http://localhost:3000/ar', { waitUntil: 'networkidle', timeout: 120000 });
  await p.waitForTimeout(1500);
  const d = await p.evaluate(() => {
    const btn = document.querySelector('header button[aria-label="فتح القائمة"]');
    if (!btn) return { found: false };
    const svg = btn.querySelector('svg');
    const r = btn.getBoundingClientRect();
    const sr = svg ? svg.getBoundingClientRect() : null;
    const cs = getComputedStyle(btn);
    const ss = svg ? getComputedStyle(svg) : null;
    return {
      found: true,
      btn: { x: r.x, y: r.y, w: r.width, h: r.height },
      svgRect: sr ? { x: sr.x, y: sr.y, w: sr.width, h: sr.height } : null,
      btnColor: cs.color,
      svgStroke: ss ? ss.stroke : null,
      svgDisplay: ss ? ss.display : null,
      btnHTML: btn.outerHTML.slice(0, 300),
    };
  });
  console.log(JSON.stringify(d, null, 1));
  const btn = await p.$('header button[aria-label="فتح القائمة"]');
  if (btn) {
    await btn.screenshot({ path: 'scripts-shot/shots/hamburger-btn.png' }).catch((e) =>
      console.log('elem shot fail:', e.message.slice(0, 120))
    );
  }
  await b.close();
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});
