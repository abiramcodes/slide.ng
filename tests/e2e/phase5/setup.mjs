// One check per setup hook: the output of the deck is different because of the files in phase5/setup/.
export async function run({ t, open, press }) {
  let page = await open('/1');
  const root = (name) => page.evaluate((n) => document.documentElement.dataset[n], name);
  t.ok('main: the providers of setup/main.ts are in the app', (await root('main')) === 'yes');
  t.ok('root: setup/root.ts ran', (await root('root')) === 'yes');
  t.ok('katex: the macro of setup/katex.ts is drawn as a double-struck R', (await page.locator('.katex .mathbb').count()) === 1);
  t.ok('transformers.pre: the markdown syntax became HTML', (await page.locator('#from-pre').innerText()) === 'from pre');
  t.ok('transformers.codeblocks: the block became our element', (await page.locator('#from-codeblock').innerText()) === '11 characters');
  t.ok('preparser: the raw line was replaced before slides were cut', (await page.locator('#from-preparser').innerText()) === 'preparsed');
  t.ok('shiki: the transformer marked every highlighted block', (await page.locator('pre.shiki[data-setup="shiki"]').count()) === 2);
  t.ok('shiki: the extra language is highlighted', (await page.locator('pre.shiki[data-setup="shiki"]').last().locator('span span').count()) > 1);
  await press(page, 'x');
  t.ok('shortcuts: the added key works', (await root('shortcut')) === 'pressed');
  t.ok('shortcuts: the default keys still work', new URL(page.url()).pathname === '/1');
  await page.locator('h1').click({ button: 'right', position: { x: 20, y: 10 } });
  const labels = await page.locator('#context-menu .slidev-menu-item').allInnerTexts();
  t.ok('context menu: the added entry follows the built-in ones', labels.at(-1)?.trim() === 'Setup item' && labels.length > 1, labels.join('|'));
  await page.locator('#context-menu .slidev-menu-item', { hasText: 'Setup item' }).click();
  t.ok('context menu: the entry runs', (await root('menu')) === 'clicked');
  await page.close();

  page = await open('/1');
  const swipe = (from, to) => page.evaluate(([a, b]) => {
    const stage = document.querySelector('.stage');
    const event = (type, x) => new PointerEvent(type, { pointerType: 'touch', clientX: x, clientY: 300, bubbles: true, pointerId: 1 });
    stage.dispatchEvent(event('pointerdown', a));
    stage.dispatchEvent(event('pointerup', b));
  }, [from, to]);
  await swipe(600, 560); // too short
  await page.waitForTimeout(200);
  t.ok('touch: a short swipe stays on the slide', new URL(page.url()).pathname === '/1');
  await swipe(600, 300);
  await page.waitForFunction(() => location.pathname === '/2');
  t.ok('touch: a swipe to the left goes to the next slide', true);
  await swipe(300, 600);
  await page.waitForFunction(() => location.pathname === '/1');
  t.ok('touch: a swipe to the right goes back', true);
  await page.close();

  // Headmatter `presenter: false`: no presenter page, no button, no menu entry.
  page = await open('/presenter/1');
  t.ok('presenter: false sends the presenter address to slide 1', new URL(page.url()).pathname === '/1', page.url());
  t.ok('presenter: false hides the presenter button', !(await page.locator('#nav-presenter').isVisible()));
  t.ok('presenter: false is not offered in the context menu', !(await page.locator('#context-menu').count()));
  await page.locator('h1').click({ button: 'right', position: { x: 20, y: 10 } });
  t.ok('presenter: false leaves no presenter entry in the context menu', !(await page.locator('#context-menu').innerText()).includes('Presenter'));
  // Headmatter `fonts`: the mono list is the code font.
  const mono = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--slidev-code-font-family'));
  const used = await page.locator('pre.shiki').first().evaluate((e) => getComputedStyle(e).fontFamily);
  t.ok('fonts: the mono font becomes the code font', mono.includes('Courier New') && used.startsWith('"Courier New"'), used);
  await page.close();

  page = await open('/2');
  await page.waitForSelector('.mermaid > svg', { timeout: 20000 });
  const svg = await page.locator('.mermaid > svg').innerHTML();
  t.ok('mermaid: the config of setup/mermaid.ts colours the diagram', /#ff0000|rgb\(255, 0, 0\)/i.test(svg));
  await page.close();

  page = await open('/3');
  await page.waitForSelector('.monaco-editor .view-lines', { timeout: 30000 });
  const size = await page.locator('.monaco-editor .view-lines').first().evaluate((e) => getComputedStyle(e).fontSize);
  t.ok('monaco: the options of setup/monaco.ts apply to the editor', size === '22px', size);
  await page.waitForFunction(() => /python says 2/.test(document.querySelector('.slidev-runner-output')?.textContent ?? ''), null, { timeout: 20000 });
  t.ok('code runners: the python runner of setup/code-runners.ts ran the editor', (await page.locator('.slidev-runner-output').innerText()).includes('python says 2'));
  await page.close();
}
