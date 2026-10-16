// Helpers shared by the showcase browser tests: open a page, press keys, read the readout.
export function makeContext(base, browser, t) {
  const problems = []; // console errors and warnings, must stay empty
  async function open(url, size = { width: 1280, height: 720 }) {
    const page = await browser.newPage({ viewport: size });
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(String(e)));
    await page.goto(base + url);
    await page.waitForFunction(() => /clicks \d+\/\d+/.test(document.querySelector('#hud')?.innerText ?? ''));
    await page.waitForTimeout(150);
    return page;
  }
  const press = async (page, key, wait = 200) => { await page.keyboard.press(key); await page.waitForTimeout(wait); };
  const hud = async (page) => (await page.locator('#hud').innerText()).trim();
  const pathOf = (page) => new URL(page.url()).pathname;
  const clicksOf = (page) => new URL(page.url()).searchParams.get('clicks');
  // The element's computed style value.
  const style = (page, selector, prop) => page.locator(selector).first().evaluate((e, p) => getComputedStyle(e)[p], prop);
  return { t, base, browser, problems, open, press, hud, pathOf, clicksOf, style };
}
