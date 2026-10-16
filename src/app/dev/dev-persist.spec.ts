import { changedDrawings, saveDrawings } from './dev-persist';

describe('changedDrawings', () => {
  it('lists new, changed and cleared drawings, and not the same ones', () => {
    expect(changedDrawings({ 1: 'a', 2: 'b', 3: 'c' }, { 1: 'a', 2: 'B', 4: 'd' })).toEqual({ 2: 'B', 3: '', 4: 'd' });
  });
  it('treats a missing drawing and an empty one as the same', () => {
    expect(changedDrawings({ 1: '' }, {})).toEqual({});
  });
});

describe('saveDrawings', () => {
  it('sends only what changed and remembers what the server accepted', async () => {
    const sent: string[] = [];
    const api = { send: async (_m: string, path: string, body: { svg: string }) => { sent.push(`${path}=${body.svg}`); return path !== '/drawings/9'; } };
    const result = await saveDrawings(api as never, { 1: 'a', 2: 'b' }, { 1: 'a', 2: '', 3: 'c', 9: 'x' });
    expect(sent.sort()).toEqual(['/drawings/2=', '/drawings/3=c', '/drawings/9=x']);
    expect(result).toEqual({ 1: 'a', 3: 'c' }); // 9 was refused, so it will be tried again
  });
});
