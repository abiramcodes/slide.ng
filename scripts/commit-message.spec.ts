import { describe, expect, it } from 'vitest';
import { checkMessage, SCOPES, TYPES } from './commit-message.mjs';

describe('checkMessage', () => {
  it('accepts a type, a scope and a summary', () => {
    expect(checkMessage('feat(layouts): add the quote layout')).toEqual([]);
  });

  it('accepts a message without a scope, and a body after a blank line', () => {
    expect(
      checkMessage('fix: keep the click count on reload\n\nIt was reset by the router.'),
    ).toEqual([]);
  });

  it('accepts every listed type and scope', () => {
    for (const type of TYPES) expect(checkMessage(`${type}: do something`)).toEqual([]);
    for (const scope of SCOPES) expect(checkMessage(`chore(${scope}): do something`)).toEqual([]);
  });

  it('ignores comment lines, as git does', () => {
    expect(checkMessage('docs: explain the hooks\n# Please enter the message')).toEqual([]);
  });

  it('lets git merge and fixup messages through, but not in a title', () => {
    expect(checkMessage('Merge branch "x"')).toEqual([]);
    expect(checkMessage('fixup! feat: add a thing')).toEqual([]);
    expect(checkMessage('Merge branch "x"', { allowAutomatic: false })).not.toEqual([]);
  });

  it('rejects an empty message', () => {
    expect(checkMessage('  \n')).toEqual(['The message is empty.']);
  });

  it('rejects a first line without the type', () => {
    expect(checkMessage('Add a thing')[0]).toContain('type(scope): summary');
  });

  it('rejects an unknown type and an unknown scope', () => {
    expect(checkMessage('feature: add a thing')[0]).toContain('not a type');
    expect(checkMessage('feat(banana): add a thing')[0]).toContain('not a scope');
  });

  it('rejects a trailing period, a capital letter and a long first line', () => {
    expect(checkMessage('fix: add a thing.')).toHaveLength(1);
    expect(checkMessage('fix: Add a thing')).toHaveLength(1);
    expect(checkMessage(`fix: ${'a'.repeat(80)}`)[0]).toContain('characters');
  });

  it('needs a blank line before the body', () => {
    expect(checkMessage('fix: a thing\nbody right away')[0]).toContain('blank line');
  });

  it('rejects trailer lines', () => {
    const message = 'fix: a thing\n\nWhy.\n\nCo-authored-by: Someone <a@example.com>';
    expect(checkMessage(message)[0]).toContain('trailer');
  });
});
