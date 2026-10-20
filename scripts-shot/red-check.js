const { chromium } = require('@playwright/test');

(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu'] });
  const p = await b.newPage({ viewport: { width: 375, height: 812 }, colorScheme: 'dark' });
  await p.goto('http://localhost:3000/ar', { waitUntil: 'networkidle', timeout: 120000 });
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    const svg = document.querySelector('header button[aria-label="فتح القائمة"] svg');
    if (svg) {
      svg.style.stroke = 'red';
      svg.style.background = 'yellow';
    }
  });
  await p.waitForTimeout(400);
  await p.screenshot({
    path: 'scripts-shot/shots/hamburger-red.png',
    clip: { x: 280, y: 0, width: 95, height: 64 },
  });
  await b.close();
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});
