// What a generated slide is allowed to use.
// A standalone Angular component must list what its template uses, so the
// generator checks the slide's HTML against these tables and imports only
// what is needed. To make your own component available in slides, add a line
// to COMPONENTS.

// Layouts: the name used in `layout:` frontmatter.
export const LAYOUTS = {
  default: { className: 'DefaultLayout', tag: 'sn-default', file: 'layouts/default' },
  cover: { className: 'CoverLayout', tag: 'sn-cover', file: 'layouts/cover' },
  center: { className: 'CenterLayout', tag: 'sn-center', file: 'layouts/center' },
  'two-cols': { className: 'TwoColsLayout', tag: 'sn-two-cols', file: 'layouts/two-cols' },
};

// Components and directives: `test` finds out if the slide uses it.
export const COMPONENTS = [
  { className: 'VClick', file: 'lib/v-click', test: /[\s[](v-click|v-after)(-hide)?\]?[\s=>/]/ },
  { className: 'VClicks', file: 'lib/v-clicks', test: /<v-clicks/ },
  { className: 'Counter', file: 'lib/counter', test: /<app-counter/ },
];
