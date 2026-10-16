import { describe, expect, it } from 'vitest';
import { pickCommand } from './pick-command.mjs';

describe('pickCommand', () => {
  it('starts the dev server when no command is given', () => {
    expect(pickCommand([])).toEqual(['dev', []]);
    expect(pickCommand(['my.md', '--open'])).toEqual(['dev', ['my.md', '--open']]);
    expect(pickCommand(['--port', '4300'])).toEqual(['dev', ['--port', '4300']]);
  });
  it('takes the first word as the command', () => {
    expect(pickCommand(['build', '--base', '/x/'])).toEqual(['build', ['--base', '/x/']]);
    expect(pickCommand(['theme', 'eject'])).toEqual(['theme', ['eject']]);
  });
});
