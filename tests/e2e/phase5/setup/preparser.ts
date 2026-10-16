// Preparser: a line of its own is replaced before the file is cut into slides.
export default () => [
  {
    name: 'preparsed',
    transformRawLines(lines: string[]) {
      lines.forEach((line, i) => {
        if (line === 'PREPARSED') lines[i] = '<p id="from-preparser">preparsed</p>';
      });
    },
  },
];
