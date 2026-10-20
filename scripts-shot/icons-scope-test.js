const { chromium } = require('@playwright/test');

(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu'] });
  const p = await b.newPage({ viewport: { width: 720, height: 900 }, colorScheme: 'dark' });
  await p.goto('http://localhost:3000/ar', { waitUntil: 'networkidle', timeout: 120000 });
  await p.waitForTimeout(2000);
  const d = await p.evaluate(() => {
    // 1) hamburger with inline style url()
    const icon = document.querySelector('header button[aria-label="فتح القائمة"] svg');
    if (icon) icon.style.stroke = 'url(#nexora-icon-gradient)';
    // 2) find a below-fold lucide icon (services section)
    const icons = Array.from(document.querySelectorAll('main section .lucide'));
    const sample = icons.slice(0, 6).map((ic) => {
      const r = ic.getBoundingClientRect();
      return { cls: ic.getAttribute('class')?.slice(0, 40), x: Math.round(r.x), y: Math.round(r.y + window.scrollY), visible: r.width > 0 };
    });
    return { sample, total: icons.length };
  });
  console.log(JSON.stringify(d, null, 1));
  await p.waitForTimeout(400);
  // header clip (inline url test)
  await p.screenshot({ path: 'scripts-shot/shots/hamburger-inline-url.png', clip: { x: 280, y: 0, width: 95, height: 64 } });
  // scroll to services icons and clip
  await p.evaluate(() => window.scrollTo(0, 1400));
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'scripts-shot/shots/services-icons.png', clip: { x: 0, y: 0, width: 720, height: 500 } });
  await b.close();
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});
