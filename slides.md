---
title: slide.ng starter deck
layout: cover
author: you
---

# slide.ng

Slides in markdown, powered by Angular.

<!-- Notes go in the last HTML comment of a slide. -->

---

# Angular in markdown

Count is {{ c.n() }}.

@if (c.n() > 5) {
<p id="big">The counter is above five.</p>
}

<app-counter #c [start]="5" />

---

# Code stays literal

```ts
const o = { a: 1 }; // @Component {{ x }}
```

Inline code too: `{{ x }}` and `@if`.

---
layout: center
---

# A centered slide

Layout `center`

---
layout: two-cols
---

# Left column

Text on the left.

::right::

# Right column

Text on the right.

---
class: text-center
title: Custom class
---

# Frontmatter class

This slide has `class: text-center`.

---

# Click variants

<div id="a" v-click>A: v-click (click 1)</div>

<div id="b" v-click="+1">B: relative +1 (click 2)</div>

<div id="r" [v-click]="[3,4]">R: range [3,4], only at click 3</div>

<div id="h" v-click="2" v-click-hide>H: hide variant, visible until click 2</div>

<div id="af" v-after>AF: v-after, shows together with B (click 2)</div>

---

# v-clicks

<v-clicks>

- item one
- item two
- item three

</v-clicks>

---
hide: true
---

# Hidden slide

This slide is not part of the deck.

---

# Plain slide

Some **bold** text and `inline code`.

---

# The end

<div id="x1" v-click>last-click-one</div>
