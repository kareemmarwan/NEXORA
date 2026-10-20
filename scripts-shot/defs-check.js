const { chromium } = require('@playwright/test');

(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu'] });
  const p = await b.newPage({ viewport: { width: 375, height: 812 }, colorScheme: 'dark' });
  await p.goto('http://localhost:3000/ar', { waitUntil: 'networkidle', timeout: 120000 });
  await p.waitForTimeout(1500);
  const d = await p.evaluate(() => {
    const def = document.querySelector('#nexora-icon-gradient');
    const defSvg = def ? def.closest('svg') : null;
    const lucideCount = document.querySelectorAll('.lucide').length;
    const footerIcon = document.querySelector('footer .lucide');
    const fRect = footerIcon ? footerIcon.getBoundingClientRect() : null;
    return {
      defExists: !!def,
      defParentDisplay: defSvg ? getComputedStyle(defSvg).display : null,
      defParentSize: defSvg ? defSvg.getBoundingClientRect().width + 'x' + defSvg.getBoundingClientRect().height : null,
      lucideCount,
      footerIconVisible: fRect ? fRect.width > 0 : false,
    };
  });
  console.log(JSON.stringify(d, null, 1));
  await p.screenshot({ path: 'scripts-shot/shots/full-375.png', fullPage: false });
  await b.close();
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});
