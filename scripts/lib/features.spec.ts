import { detectLangs, hasMagicMove, hasMath } from './features.mjs';

describe('detectLangs', () => {
  it('finds the languages of fences, magic-move steps and snippet lines', () => {
    const text = '```ts {1}\nx\n```\n````md magic-move\n```js\na\n```\n````\n<<< ./a/b.py\n<<< ./c.txt#r sh {1}';
    expect([...detectLangs(text)].sort()).toEqual(['js', 'md', 'py', 'sh', 'ts']);
  });
});

describe('detect magic move', () => {
  it('needs four backticks and the words md magic-move', () => {
    expect(hasMagicMove('````md magic-move\n```js\n```\n````')).toBe(true);
    expect(hasMagicMove('```md magic-move\n```')).toBe(false);
    expect(hasMath('no math')).toBe(false);
  });
});
