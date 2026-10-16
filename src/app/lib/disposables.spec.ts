import { Disposables } from './disposables';

describe('Disposables', () => {
  it('disposes what it holds, last added first', () => {
    const log: string[] = [];
    const all = new Disposables();
    all.add({ dispose: () => log.push('model') });
    all.add({ dispose: () => log.push('editor') });
    all.disposeAll();
    expect(log).toEqual(['editor', 'model']);
  });
  it('disposes an item that arrives after everything was disposed', () => {
    const all = new Disposables();
    all.disposeAll();
    let done = false;
    all.add({ dispose: () => (done = true) });
    expect(done).toBe(true);
    expect(all.isDisposed).toBe(true);
  });
});
