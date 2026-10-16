// Which command an argument list means. `slide-ng`, `slide-ng my.md` and `slide-ng --port 4300` all mean `dev`.
export function pickCommand(argv) {
  const [first] = argv;
  if (first === undefined || first.startsWith('-') || first.endsWith('.md')) return ['dev', argv];
  return [first, argv.slice(1)];
}
