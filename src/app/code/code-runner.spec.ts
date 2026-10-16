import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ClicksContext } from '../lib/clicks';
import { CodeRunner } from './code-runner';
import type { RunResult } from './monaco/run-js';

describe('CodeRunner', () => {
  it('keeps the newest result when an older run ends later', async () => {
    const done: Array<(r: RunResult) => void> = [];
    const execute = () => new Promise<RunResult>((resolve) => done.push(resolve));
    TestBed.configureTestingModule({
      providers: [{ provide: ClicksContext, useValue: { register() {}, unregister() {} } }],
    });
    const fixture = TestBed.createComponent(CodeRunner);
    fixture.componentRef.setInput('code', 'x');
    fixture.componentRef.setInput('execute', execute);
    fixture.componentRef.setInput('autorun', false);
    const run = () => (fixture.componentInstance as unknown as { run(): Promise<void> }).run();
    const old = run();
    const fresh = run();
    done[1]({ lines: [['new']] });
    await fresh;
    done[0]({ lines: [['old']] });
    await old;
    const result = (fixture.componentInstance as unknown as { result(): RunResult }).result();
    expect(result.lines).toEqual([['new']]);
  });
});
