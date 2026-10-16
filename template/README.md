# {{name}}

Slides made with slide.ng.

```sh
npm install
npm run dev      # http://localhost:4230
npm run build    # a static site in ./dist
npm run export   # slides-export.pdf (needs Chromium, see the slide.ng docs)
```

Edit `slides.md`. Put pictures in `public/` and refer to them as `/picture.png`.
Your own Angular components go in `components/` and your own layouts in `layouts/`.

Coding agents can read an agent skill for slide.ng: `npx slide-ng skills install` copies it to `.agents/skills/slide-ng`.
