import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { skillsCommand } from './skills.mjs';

let pkg: string;
let project: string;
const run = (args: string[]) => skillsCommand(args, { packageRoot: pkg, project });

beforeEach(() => {
  pkg = mkdtempSync(join(tmpdir(), 'slide-ng-skill-pkg-'));
  project = mkdtempSync(join(tmpdir(), 'slide-ng-skill-project-'));
  mkdirSync(join(pkg, 'skills/slide-ng/references'), { recursive: true });
  writeFileSync(join(pkg, 'skills/slide-ng/SKILL.md'), '---\nname: slide-ng\n---\n# v1\n');
  writeFileSync(join(pkg, 'skills/slide-ng/references/core-cli.md'), 'cli');
});

describe('skills install', () => {
  it('copies the skill into .agents/skills/slide-ng by default', async () => {
    await run(['install']);
    expect(readFileSync(join(project, '.agents/skills/slide-ng/SKILL.md'), 'utf8')).toContain('v1');
    expect(existsSync(join(project, '.agents/skills/slide-ng/references/core-cli.md'))).toBe(true);
  });
  it('takes another folder with --dir', async () => {
    await run(['install', '--dir', 'tools/skills']);
    expect(existsSync(join(project, 'tools/skills/slide-ng/SKILL.md'))).toBe(true);
  });
  it('never overwrites without --force', async () => {
    await run(['install']);
    writeFileSync(join(project, '.agents/skills/slide-ng/mine.md'), 'mine');
    await expect(run(['install'])).rejects.toThrow('already exists');
    expect(existsSync(join(project, '.agents/skills/slide-ng/mine.md'))).toBe(true);
  });
  it('replaces its own copy with --force, and nothing else', async () => {
    await run(['install']);
    writeFileSync(join(pkg, 'skills/slide-ng/SKILL.md'), '---\nname: slide-ng\n---\n# v2\n');
    await run(['install', '--force']);
    expect(readFileSync(join(project, '.agents/skills/slide-ng/SKILL.md'), 'utf8')).toContain('v2');
    const other = join(project, 'x/slide-ng');
    mkdirSync(other, { recursive: true });
    writeFileSync(join(other, 'notes.txt'), 'not a skill');
    await expect(run(['install', '--dir', 'x', '--force'])).rejects.toThrow(
      'not the slide-ng skill',
    );
    expect(existsSync(join(other, 'notes.txt'))).toBe(true);
  });
  it('refuses a folder outside the project', async () => {
    await expect(run(['install', '--dir', '../elsewhere'])).rejects.toThrow('outside the project');
    await expect(run(['install', '--dir', tmpdir()])).rejects.toThrow('outside the project');
    await expect(run(['install', '--dir', '.'])).resolves.toBeTruthy(); // ./slide-ng is inside
  });
  it('refuses a symbolic link that leads out of the project', async () => {
    const outside = mkdtempSync(join(tmpdir(), 'slide-ng-skill-out-'));
    symlinkSync(outside, join(project, 'link'), 'dir');
    await expect(run(['install', '--dir', 'link/skills'])).rejects.toThrow('outside the project');
    expect(existsSync(join(outside, 'skills'))).toBe(false);
  });
  it('knows only install', async () => {
    await expect(run([])).rejects.toThrow('Usage');
    await expect(run(['remove'])).rejects.toThrow('Usage');
  });
});
