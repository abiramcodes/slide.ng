// KaTeX: drawn while generating; only the stylesheet is loaded. Row highlights follow the clicks.
export async function run({ t, open, press, hud }) {
  const page = await open('/8');
  t.ok('inline math is drawn', (await page.locator('p .katex').count()) === 1);
  t.ok('block math is drawn as display math', (await page.locator('.katex-display').count()) === 2);
  t.ok('"$5 and $10" stays text and `$HOME` stays code', (await page.locator('p').first().innerText()).includes('$5 and $10') && (await page.locator('p code').innerText()) === '$HOME');
  t.ok('the KaTeX stylesheet is loaded (fonts declared)', await page.evaluate(() => [...document.fonts].some((f) => f.family.startsWith('KaTeX'))));
  t.ok('{{ in a formula is not read by Angular: the source text keeps it', (await page.locator('.slidev-katex-wrapper .sr-only').first().textContent()).includes('{{b}}'));
  t.ok('the TeX source is kept for screen readers', (await page.locator('p .sr-only').first().textContent()).startsWith('\\sqrt{3x-1}'));
  t.ok('{1|2|all} makes 2 clicks', /^slide 8\/\d+ clicks 0\/2$/.test(await hud(page)), await hud(page));
  const second = page.locator('.slidev-katex-wrapper').nth(1);
  const lit = () => second.locator('.highlighted').evaluateAll((c) => c.map((e) => e.textContent).join(''));
  t.ok('row 1 is highlighted at the start, other rows dimmed', (await lit()).includes('ρ') && !(await lit()).includes('∂') && (await second.locator('.dishonored').count()) === 4);
  await press(page, 'ArrowRight');
  t.ok('click 1 highlights row 2', !(await lit()).includes('ρ') && (await lit()).includes('0') && !(await lit()).includes('∂'), await lit());
  await press(page, 'ArrowRight');
  t.ok('click 2 highlights all rows', (await second.locator('.dishonored').count()) === 0 && (await second.locator('.highlighted').count()) === 6);
  await page.close();
}
