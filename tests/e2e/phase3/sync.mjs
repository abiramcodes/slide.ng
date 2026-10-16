// Windows of one browser follow each other through a BroadcastChannel.
export async function run({ t, open, hud, windowGroup }) {
  const group = await windowGroup();
  const viewer = await open('/1', undefined, undefined, group);
  const other = await open('/1', undefined, undefined, group);

  // The other window plays the presenter: it sends a message like a presenter page does.
  await other.evaluate(() => {
    const ch = new BroadcastChannel('slide-ng-sync');
    ch.postMessage({ channel: 'shared', data: { page: 2, clicks: 1, clicksTotal: 2, lastUpdate: { id: 'x', type: 'presenter', time: Date.now() } } });
  });
  await viewer.waitForTimeout(500);
  t.ok('a viewer follows a presenter message to another slide and click', (await hud(viewer)) === 'slide 2/4 clicks 1/2', await hud(viewer));
  t.ok('the address changed without a new history entry', new URL(viewer.url()).pathname === '/2' && (await viewer.evaluate(() => history.length)) <= 3);

  await other.evaluate(() => {
    const ch = new BroadcastChannel('slide-ng-sync');
    ch.postMessage({ channel: 'shared', data: { page: 2, clicks: 2, clicksTotal: 2, lastUpdate: { id: 'x', type: 'presenter', time: Date.now() + 1 } } });
  });
  await viewer.waitForTimeout(400);
  t.ok('a click change on the same slide is followed too', (await hud(viewer)) === 'slide 2/4 clicks 2/2', await hud(viewer));

  await other.evaluate(() => {
    const ch = new BroadcastChannel('slide-ng-sync');
    ch.postMessage({ channel: 'shared', data: { page: 'evil', clicks: -5, lastUpdate: { id: 'x', type: 'presenter', time: Date.now() + 2 } } });
  });
  await viewer.waitForTimeout(300);
  t.ok('a bad message does not move the viewer', (await hud(viewer)) === 'slide 2/4 clicks 2/2', await hud(viewer));
  await group.close();
}
