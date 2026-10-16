// The settings menu: dark mode, filters, cursor options, wake lock, camera options and the PDF stub.
export async function run({ t, open, press }) {
  const page = await open('/presenter/1');
  await page.bringToFront();
  const menu = async () => {
    await page.locator('#nav-settings').click();
    await page.waitForTimeout(250);
  };
  await menu();
  const ids = await page.locator('#settings-menu [id]').evaluateAll((l) => l.map((e) => e.id));
  for (const id of [
    'settings-dark',
    'scale-fit',
    'hide-idle-cursor',
    'wake-lock',
    'settings-cursor',
    'cursor-style-laser',
    'filter-brightness',
    'filter-reset',
    'camera-select',
    'mic-select',
    'record-screen',
    'download-pdf',
  ]) {
    t.ok(`settings has #${id}`, ids.includes(id), ids.join());
  }
  t.ok(
    'the PDF entry is disabled while the deck has no PDF next to it',
    await page.locator('#download-pdf').isDisabled(),
  );

  // dark mode
  await page.locator('#settings-dark').check();
  await page.waitForTimeout(200);
  t.ok(
    'Dark Mode switches the page',
    await page.evaluate(() => document.documentElement.classList.contains('dark')),
  );
  await page.locator('#settings-dark').uncheck();
  await page.waitForTimeout(200);
  t.ok(
    'and back',
    !(await page.evaluate(() => document.documentElement.classList.contains('dark'))),
  );

  // filters
  const canvasFilter = () =>
    page
      .locator('.canvas')
      .first()
      .evaluate((e) => getComputedStyle(e).filter);
  t.ok('no filter at first', (await canvasFilter()) === 'none');
  await page.locator('#filter-brightness').fill('150');
  await page.waitForTimeout(200);
  t.ok(
    'the brightness slider filters the slide',
    (await canvasFilter()).includes('brightness(1.5)'),
    await canvasFilter(),
  );
  t.ok(
    'the choice is remembered',
    (await page.evaluate(() => localStorage.getItem('slidev-filters'))).includes('150'),
  );
  await page.locator('#filter-reset').click();
  await page.waitForTimeout(200);
  t.ok('Reset filters clears it', (await canvasFilter()) === 'none');

  // cursor options
  t.ok(
    'laser style is chosen in the menu',
    await (async () => {
      await page.locator('#cursor-style-laser').click();
      await page.waitForTimeout(200);
      return (await page.locator('#nav-cursor').getAttribute('title')) === 'Disable laser pointer';
    })(),
  );
  await page.locator('#cursor-style-cursor').click();
  await page.locator('#settings-cursor').uncheck();
  await page.waitForTimeout(200);
  t.ok(
    'Show Presenter Cursor follows the bar button',
    (await page.locator('#nav-cursor').getAttribute('title')) === 'Show presenter cursor',
  );
  await page.locator('#settings-cursor').check();

  // wake lock: the headmatter turns it on
  t.ok(
    'wakeLock: true in the headmatter starts with it on',
    await page.locator('#wake-lock').isChecked(),
  );
  const held = await page.locator('#wake-lock').getAttribute('data-held');
  if (held === 'true') t.ok('the browser holds the lock', true);
  else
    console.log(
      'NOT VERIFIED wake lock held: this browser refused the request (headless), only the setting is checked',
    );
  await page.locator('#wake-lock').uncheck();
  await page.waitForTimeout(200);
  t.ok(
    'it can be turned off and that is remembered',
    (await page.evaluate(() => localStorage.getItem('slidev-wake-lock'))) === 'false',
  );
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#hud'));
  await menu();
  t.ok(
    'the choice wins over the headmatter after a reload',
    !(await page.locator('#wake-lock').isChecked()),
  );

  // the play page has no presenter-only entries
  const play = await open('/1');
  await play.locator('#nav-settings').click();
  await play.waitForTimeout(250);
  t.ok(
    'the play page hides the presenter cursor entries',
    (await play.locator('#settings-cursor').count()) === 0 &&
      (await play.locator('#filter-contrast').count()) === 1,
  );
  await play.close();
  await page.close();
}
