// The presenter's mouse is shown on the audience's page: as an arrow, or as a laser dot.
export async function run({ t, open, windowGroup }) {
  const group = await windowGroup();
  const presenter = await open('/presenter/1', undefined, undefined, group);
  const viewer = await open('/1', undefined, undefined, group);
  const slideBox = () => presenter.locator('#slide-content').boundingBox();
  const moveToSlide = async (fx, fy) => {
    await presenter.bringToFront(); // a page in the background does not lay itself out (resize observers wait)
    await presenter.waitForTimeout(100);
    const b = await slideBox();
    await presenter.mouse.move(b.x + b.width * fx, b.y + b.height * fy, { steps: 3 });
    await presenter.waitForTimeout(300);
  };
  const where = async () =>
    viewer.evaluate(() => {
      const el = document.querySelector('#presenter-cursor, #laser-pointer');
      const canvas = document.querySelector('#slide-content').getBoundingClientRect();
      if (!el) return null;
      return {
        id: el.id,
        x: parseFloat(el.style.left),
        y: parseFloat(el.style.top),
        canvas: [canvas.width, canvas.height],
      };
    });

  t.ok(
    'no cursor on the viewer before the presenter moves over the slide',
    (await where()) === null,
  );
  await moveToSlide(0.25, 0.5);
  let w = await where();
  t.ok(
    'the presenter cursor appears on the viewer as an arrow at the same relative place',
    w && w.id === 'presenter-cursor' && Math.abs(w.x - 25) < 2 && Math.abs(w.y - 50) < 2,
    JSON.stringify(w),
  );

  // The viewer window has another size: the position is a percent, so it still lands in the same place.
  await viewer.setViewportSize({ width: 800, height: 700 });
  await viewer.waitForTimeout(300);
  w = await where();
  t.ok(
    'a different window size keeps the relative position',
    w && Math.abs(w.x - 25) < 2 && Math.abs(w.y - 50) < 2,
    JSON.stringify(w),
  );

  await presenter.mouse.move(5, 5);
  await presenter.waitForTimeout(300);
  t.ok(
    'the cursor leaves the viewer when the presenter mouse leaves the slide',
    (await where()) === null,
  );

  // The toggle in the bar.
  await moveToSlide(0.75, 0.25);
  t.ok('the cursor is back over the slide', (await where()) !== null);
  await presenter.locator('#nav-cursor').click();
  await presenter.waitForTimeout(300);
  t.ok(
    'the nav button hides the presenter cursor from the audience',
    (await where()) === null &&
      (await presenter.locator('#nav-cursor').getAttribute('title')) === 'Show presenter cursor',
  );
  await presenter.locator('#nav-cursor').click();
  await moveToSlide(0.6, 0.6);
  t.ok('and shows it again', (await where()) !== null);

  // Laser style.
  await presenter.evaluate(() => localStorage.setItem('slidev-cursor-style', '"laser"'));
  await presenter.reload();
  await presenter.waitForFunction(() =>
    /clicks \d+\/\d+/.test(document.querySelector('#hud')?.innerText ?? ''),
  );
  await presenter.waitForTimeout(500);
  await moveToSlide(0.4, 0.3);
  w = await where();
  t.ok(
    'laser style shows a dot on the viewer',
    w && w.id === 'laser-pointer' && Math.abs(w.x - 40) < 2 && Math.abs(w.y - 30) < 2,
    JSON.stringify(w),
  );
  t.ok(
    'the presenter sees the laser on its own slide and the real cursor is hidden there',
    (await presenter.locator('#laser-pointer').count()) === 1 &&
      (await presenter.evaluate(
        () => getComputedStyle(document.querySelector('.slide-show')).cursor,
      )) === 'none',
  );
  t.ok(
    'the nav button names the laser',
    (await presenter.locator('#nav-cursor').getAttribute('title')) === 'Disable laser pointer',
  );
  await presenter.evaluate(() => localStorage.removeItem('slidev-cursor-style'));
  await group.close();
}
