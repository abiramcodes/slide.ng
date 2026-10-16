// Camera bubble, recording controls and screen mirror, with Chromium's fake camera and microphone.
import { statSync } from 'node:fs';

export async function run({ t, open }) {
  const page = await open('/presenter/1');
  await page.bringToFront();
  const titles = await page.locator('nav button').evaluateAll((l) => l.map((e) => e.title));
  t.ok('record is on, so the bar has camera and record buttons', titles.includes('Show camera view') && titles.includes('Start recording'), titles.join('|'));
  t.ok('no bubble before the camera is switched on', (await page.locator('#web-camera').count()) === 0);

  // ---- camera bubble
  await page.locator('#nav-camera').click();
  await page.waitForSelector('#web-camera video');
  await page.waitForFunction(() => document.querySelector('#web-camera video')?.videoWidth > 0, null, { timeout: 8000 });
  t.ok('the camera button shows the bubble with a live picture', await page.locator('#web-camera video').evaluate((v) => v.videoWidth > 0 && !v.paused));
  t.ok('the button now offers to hide it', (await page.locator('#nav-camera').getAttribute('title')) === 'Hide camera view');
  const box = await page.locator('#web-camera').boundingBox();
  t.ok('the bubble is round and 192px wide', Math.abs(box.width - 192) < 2 && (await page.locator('#web-camera').evaluate((e) => getComputedStyle(e).borderRadius)) !== '0px');
  await page.mouse.move(box.x + 96, box.y + 96);
  await page.mouse.down();
  await page.mouse.move(box.x + 300, box.y + 250, { steps: 5 });
  await page.mouse.up();
  const moved = await page.locator('#web-camera').boundingBox();
  t.ok('the bubble can be dragged', Math.abs(moved.x - box.x) > 150 && Math.abs(moved.y - box.y) > 100, `${box.x},${box.y} -> ${moved.x},${moved.y}`);
  t.ok('its place is remembered', !!(await page.evaluate(() => localStorage.getItem('slidev-camera-pos'))));

  await page.locator('#nav-settings').click();
  await page.waitForTimeout(300);
  t.ok('settings list the fake camera and microphone', (await page.locator('#camera-select option').count()) >= 2 && (await page.locator('#mic-select option').count()) >= 2, (await page.locator('#camera-select option').count()) + '/' + (await page.locator('#mic-select option').count()));
  await page.locator('#camera-mirror').check();
  await page.waitForTimeout(200);
  t.ok('the mirror option flips the picture', await page.locator('#web-camera video').evaluate((v) => getComputedStyle(v).transform !== 'none'));
  await page.reload();
  await page.waitForSelector('#web-camera video');
  t.ok('the camera stays on after a reload', (await page.locator('#web-camera').count()) === 1);

  // ---- recording the camera
  await page.locator('#nav-settings').click();
  await page.locator('#record-camera').click();
  await page.locator('#nav-settings').click();
  await page.locator('#nav-record').click();
  await page.waitForSelector('#record-time');
  await page.waitForTimeout(2300);
  t.ok('the timer counts while recording', (await page.locator('#record-time').innerText()) >= '00:02', await page.locator('#record-time').innerText());
  await page.locator('#nav-record-pause').click();
  const paused = await page.locator('#record-time').innerText();
  await page.waitForTimeout(1500);
  t.ok('pause stops the timer', (await page.locator('#record-time').innerText()) === paused && (await page.locator('#nav-record-pause').getAttribute('title')) === 'Resume recording');
  await page.locator('#nav-record-pause').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#nav-record').click()]);
  t.ok('stopping downloads a webm named after the deck', /^phase-3-deck-\d{4}-\d\d-\d\d-\d\d-\d\d-\d\d\.webm$/.test(download.suggestedFilename()), download.suggestedFilename());
  const size = statSync(await download.path()).size;
  t.ok('the file holds video', size > 2000, String(size));
  t.ok('the controls return to idle', (await page.locator('#record-time').count()) === 0 && (await page.locator('#nav-record').getAttribute('title')) === 'Start recording');

  // ---- recording the screen and the mirror: depends on what this browser allows without a person
  await page.locator('#nav-settings').click();
  await page.locator('#record-screen').click();
  await page.locator('#nav-settings').click();
  await page.locator('#nav-record').click();
  await page.waitForTimeout(2500);
  if (await page.locator('#record-time').count()) {
    const [screen] = await Promise.all([page.waitForEvent('download'), page.locator('#nav-record').click()]);
    t.ok('screen recording downloads a webm', screen.suggestedFilename().endsWith('.webm') && statSync(await screen.path()).size > 1000);
  } else {
    console.log('NOT VERIFIED screen recording: the browser refused without a person to pick a source:', await page.locator('#record-error').innerText().catch(() => ''));
  }
  await page.locator('#main-mirror').click();
  await page.waitForTimeout(200);
  t.ok('Screen Mirror hides the slide and offers sharing', (await page.locator('#mirror-start').isVisible()) && !(await page.locator('#slide-container').isVisible()));
  await page.locator('#mirror-start').click();
  await page.waitForTimeout(1500);
  if (await page.locator('#mirror-stop').count()) t.ok('the mirror shows a video', await page.locator('app-screen-mirror video').evaluate((v) => v.videoWidth > 0));
  else console.log('NOT VERIFIED screen mirror picture: the browser refused without a person to pick a source');
  await page.locator('#main-slides').click();
  await page.waitForTimeout(200);
  t.ok('Slides brings the slide back', await page.locator('#slide-container').isVisible());
  await page.close();
}
