// Slide transitions: slides 33 (slide-left), 34 (fade), 35 (view-transition) in showcase/slides.md.
export async function run({ t, open, press, pathOf, hud, base, browser, problems }) {
  const page = await open('/33');
  await page.addInitScript(() => {});
  // Counts how often the browser's view transition is started.
  await page.evaluate(() => {
    window['__vt'] = 0;
    const orig = document.startViewTransition?.bind(document);
    if (orig) document.startViewTransition = (cb) => { window['__vt']++; return orig(cb); };
  });
  const state = () => page.evaluate(() => ({
    hosts: [...document.querySelectorAll('.canvas > [class]')].length || document.querySelectorAll('.canvas > *').length,
    slides: [...document.querySelectorAll('.canvas > *')].filter((e) => /^SLIDE-/.test(e.tagName)).map((e) => e.tagName.toLowerCase()),
    name: document.querySelector('.canvas').dataset.transition ?? null,
    animations: document.getAnimations().map((a) => a.effect.getKeyframes().map((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x)).join()).join('>')),
    forward: document.querySelector('.stage').classList.contains('slidev-nav-go-forward'),
    backward: document.querySelector('.stage').classList.contains('slidev-nav-go-backward'),
  }));

  await page.keyboard.press('ArrowRight'); // 33 -> 34, the transition is set on slide 33
  await page.waitForTimeout(150);
  let s = await state();
  t.ok('slide-left: both slides are in the page while it runs', s.slides.join() === 'slide-033,slide-034', s.slides.join());
  t.ok('slide-left: the transition name is on the canvas and the stage knows the direction', s.name === 'slide-left' && s.forward && !s.backward, JSON.stringify(s));
  t.ok('slide-left: two translate animations are running', s.animations.length === 2 && s.animations.every((a) => a.includes('translate')), s.animations.join('|'));
  await page.waitForTimeout(700);
  s = await state();
  t.ok('slide-left: the old slide is removed afterwards', s.slides.join() === 'slide-034' && s.name === null && s.animations.length === 0, JSON.stringify(s));
  t.ok('slide-left: navigation worked', pathOf(page) === '/34' && (await hud(page)).startsWith('slide 34/'));

  await page.keyboard.press('ArrowRight'); // 34 -> 35: fade
  await page.waitForTimeout(150);
  s = await state();
  t.ok('fade: opacity animations on both slides', s.name === 'fade' && s.animations.length === 2 && s.animations.every((a) => a.includes('opacity')), JSON.stringify(s));
  await page.waitForTimeout(700);

  await page.keyboard.press('ArrowRight'); // 35 -> 36: view-transition
  await page.waitForTimeout(700);
  const vt = await page.evaluate(() => [window['__vt'], 'startViewTransition' in document]);
  t.ok('view-transition: uses the browser API when it exists, and navigation works', pathOf(page) === '/36' && (vt[1] ? vt[0] === 1 : true), `${pathOf(page)} calls=${vt[0]} supported=${vt[1]}`);
  t.ok('view-transition: only one slide is left in the page', (await state()).slides.join() === 'slide-036');

  // Going back uses the "backward" variant (slide-left becomes slide-right).
  await page.keyboard.press('ArrowLeft'); // 36 -> 35
  await page.keyboard.press('ArrowLeft'); // 35 -> 34 (fade, set on slide 34)
  await page.waitForTimeout(900);
  await page.keyboard.press('ArrowLeft'); // 34 -> 33 (slide-left set on 33, backwards = slide-right)
  await page.waitForTimeout(150);
  s = await state();
  t.ok('backward uses slide-right and the backward class', s.name === 'slide-right' && s.backward && !s.forward, JSON.stringify(s));
  await page.waitForTimeout(700);

  // Pressing keys quickly must not leave extra slides behind.
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(900);
  s = await state();
  t.ok('fast navigation leaves exactly one slide', s.slides.length === 1 && pathOf(page) === '/35', JSON.stringify(s));
  await page.close();

  // Slides without a transition switch at once.
  const plain = await open('/3');
  await plain.keyboard.press('ArrowRight');
  await plain.waitForTimeout(100);
  t.ok('no transition set: no animation and one slide', (await plain.evaluate(() => [document.getAnimations().length, document.querySelectorAll('.canvas > *').length]))[0] === 0);
  await plain.close();
}
