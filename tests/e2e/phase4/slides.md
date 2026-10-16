---
title: Print deck
colorSchema: auto
exportFilename: print-deck
---

# Cover

First slide

<!-- note one -->

---

# Clicks

<div id="c1" v-click>one</div>
<div id="c2" v-click>two</div>

<render-when context="print"><p id="only-print">printing</p></render-when>
<render-when context="slide"><p id="only-slide">on screen</p></render-when>

<!-- note two [click] with a click -->

---
level: 2
---

# A flowchart

```mermaid
graph TD
  A-->B
```

---

# Moving code

````md magic-move
```ts
const a = 1
```
```ts
const a = 2
```
````

---
clicksStart: 1
---

# Starts at one

<div id="s2" v-click="2">after two</div>

---

# Editor

```ts {monaco}
const answer = 42
```

---

# Marks

<span id="mk" v-mark.red.circle="1">circled</span>

---

# The end

Done
