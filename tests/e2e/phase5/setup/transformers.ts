// Transformers: a bit of markdown syntax, and a code block language of our own.
export default () => ({
  pre: [
    ({ s }: { s: { replace: (re: RegExp, fn: (all: string, text: string) => string) => void } }) => {
      s.replace(/\[\[\[(.*?)\]\]\]/g, (_all, text) => `<b id="from-pre">${text}</b>`);
    },
  ],
  codeblocks: [
    ({ info, code }: { info: string; code: string }) => (info.startsWith('myblock') ? `<p id="from-codeblock">${code.trim().length} characters</p>` : undefined),
  ],
});
