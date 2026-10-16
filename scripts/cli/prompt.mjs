// A line of text typed on the terminal without being shown (for a password). Only called when stdin is a terminal.
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';

export function askPassword(question) {
  return new Promise((done) => {
    let muted = false;
    const out = new Writable({
      write(chunk, _enc, next) {
        if (!muted) process.stdout.write(chunk);
        next();
      },
    });
    const rl = createInterface({ input: process.stdin, output: out, terminal: true });
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      done(answer.trim());
    });
    muted = true; // the question is already out; what is typed from now on is not echoed
  });
}
