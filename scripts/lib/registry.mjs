// What a generated slide is allowed to use.
// A standalone Angular component must list what its template uses, so the
// generator checks the slide's HTML against this table and imports only
// what is needed. To make your own component available in slides, add a line
// to COMPONENTS. (Layouts live in layouts.mjs.)
export { LAYOUTS } from './layouts.mjs';

// Components and directives: `test` finds out if the slide uses it.
export const COMPONENTS = [
  { className: 'VClick', file: 'lib/v-click', test: /[\s[](v-click|v-after)(-hide)?\]?[\s=>/]/ },
  { className: 'VClicks', file: 'lib/v-clicks', test: /<v-clicks/ },
  { className: 'VClickGap', file: 'lib/v-click-gap', test: /<v-click-gap/ },
  { className: 'VSwitch', file: 'lib/v-switch', test: /<v-switch/ },
  { className: 'SlideToc', file: 'builtin/slide-toc', test: /<slide-toc/ },
  { className: 'SlideCurrentNo', file: 'builtin/slide-current-no', test: /<slide-current-no/ },
  { className: 'SlidesTotal', file: 'builtin/slides-total', test: /<slides-total/ },
  { className: 'LightOrDark', file: 'builtin/light-or-dark', test: /<light-or-dark/ },
  { className: 'RenderWhen', file: 'builtin/render-when', test: /<render-when/ },
  { className: 'SlideLink', file: 'builtin/slide-link', test: /<slide-link/ },
  { className: 'CodeBlockWrapper', file: 'code/code-block-wrapper', test: /<code-block-wrapper/ },
  { className: 'CodeGroup', file: 'code/code-group', test: /<code-group/ },
  { className: 'ShikiMagicMove', file: 'code/magic-move', test: /<shiki-magic-move/ },
  { className: 'KatexBlockWrapper', file: 'code/katex-block', test: /<katex-block-wrapper/ },
  { className: 'Mermaid', file: 'code/mermaid', test: /<mermaid[\s>]/ },
  { className: 'PlantUml', file: 'code/plant-uml', test: /<plant-uml[\s>]/ },
  { className: 'MonacoEditor', file: 'code/monaco-editor', test: /<monaco[\s>]/ },
  { className: 'Arrow', file: 'builtin/arrow', test: /<arrow[\s>/]/ },
  { className: 'AutoFitText', file: 'builtin/auto-fit-text', test: /<auto-fit-text/ },
  { className: 'Transform', file: 'builtin/transform', test: /<transform[\s>/]/ },
  { className: 'Youtube', file: 'builtin/youtube', test: /<youtube[\s>/]/ },
  { className: 'SlideVideo', file: 'builtin/slide-video', test: /<slide-video/ },
  { className: 'Tweet', file: 'builtin/tweet', test: /<tweet[\s>/]/ },
  { className: 'BlueSky', file: 'builtin/blue-sky', test: /<blue-sky/ },
  { className: 'VMark', file: 'lib/v-mark', test: /[\s[]v-mark[\s=>/.\]]/ },
  { className: 'VMotion', file: 'lib/v-motion', test: /\[v-motion\]|\sv-motion[\s=>/]/ },
  { className: 'VDrag', file: 'drag/v-drag', test: /\sv-drag[\s=>/]/ },
  { className: 'VDragBox', file: 'drag/v-drag-box', test: /<v-drag[\s>/]/ },
  { className: 'VDragArrow', file: 'drag/v-drag-arrow', test: /<v-drag-arrow[\s>/]/ },
  { className: 'SlideLayer', file: 'lib/slide-layer', test: /<app-slide-layer/ },
  { className: 'Counter', file: 'lib/counter', test: /<app-counter/ },
];
