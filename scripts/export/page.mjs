// Opening the print page and waiting until it is finished (everything lazy has arrived).

/** Query string of the print page for one batch of slides. */
export function printQuery({ withClicks, range }) {
  const q = new URLSearchParams({ print: withClicks ? 'clicks' : 'true' });
  if (range) q.set('range', range);
  return q.toString();
}

/** Address of the print page. A deck built with `routerMode: hash` keeps the route after a #. */
export function printUrl({ origin, base = '/', routerMode, query, path = 'print' }) {
  return routerMode === 'hash'
    ? `${origin}${base}#/${path}?${query}`
    : `${origin}${base}${path}?${query}`;
}

/**
 * Loads a print page and waits for it. Anything that is still not there after `timeout` is reported with
 * `warn` and the exit code becomes 1, but the export goes on (a missing picture beats no export).
 */
export async function loadPrintPage(page, { url, dark, timeout, waitUntil, wait, warn }) {
  await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', media: 'screen' });
  await page.goto(url, { waitUntil, timeout });
  await page.locator('[data-slide-ng-print="ready"]').waitFor({ state: 'attached', timeout });

  // Mermaid, Monaco, Magic Move, slide-ng-mark and the code runner mark themselves with `data-slide-ng-waitfor` until done.
  try {
    await page.waitForFunction(() => !document.querySelector('[data-slide-ng-waitfor]'), null, {
      timeout,
    });
  } catch {
    const left = await page.evaluate(() =>
      [...document.querySelectorAll('[data-slide-ng-waitfor]')].map(
        (e) => `${e.localName} (waiting for ${e.getAttribute('data-slide-ng-waitfor')})`,
      ),
    );
    warn(`these elements did not finish loading: ${left.join(', ')}`);
    process.exitCode = 1;
  }
  // Fonts and iframes (video embeds) have their own loading.
  await page.evaluate(() => document.fonts.ready);
  await Promise.all(
    page.frames().map((f) => f.waitForLoadState(undefined, { timeout }).catch(() => {})),
  );
  // Monaco keeps a hidden accessibility box that would show in a picture.
  await page.addStyleTag({ content: '.monaco-aria-container { display: none !important; }' });
  if (wait) await page.waitForTimeout(wait);
}

/** The pages of the print page in order: `{ no, id }` for each `.print-slide-container`. */
export function listPages(page) {
  return page
    .locator('.print-slide-container')
    .evaluateAll((list) =>
      list.map((e) => ({ id: e.id, no: Number(e.getAttribute('data-slide-ng-no')) })),
    );
}
