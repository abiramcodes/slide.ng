// Shiki options: one more language, and a transformer that marks every code block.
export default () => ({
  langs: ['rust'],
  transformers: [
    {
      pre(node: { properties: Record<string, unknown> }) {
        node.properties['data-setup'] = 'shiki';
      },
    },
  ],
});
