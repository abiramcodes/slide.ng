---
title: slide.ng phase 2 showcase
plantUmlServer: /plantuml
lineNumbers: false
---

# Phase 2 showcase

Code and content

---

# Plain code

```ts
const o = { a: 1 }; // {{ not }} bound, @if too
function add(a: number, b: number) {
  return a + b;
}
```

Inline `{{ x }}` stays text.

---

# Line numbers, start line, max height

```ts {*}{lines:true,startLine:5}
function add(a: number, b: number) {
  return a + b;
}
const c = add(1, 2);
```

```ts {2}{maxHeight:'60px'}
const a = 1;
const b = 2;
const c = 3;
const d = 4;
const e = 5;
const f = 6;
```

---

# Static and stepped highlights

```ts {2,3}
const a = 1;
const b = 2;
const c = 3;
const d = 4;
```

```ts {1|2-3|4|all}
const a = 1;
const b = 2;
const c = 3;
const d = 4;
```

<div v-click id="after-code">after the code</div>

---

# Snippets

<<< ./snippets/snippet.ts#greet ts {1|2}

<<< @/snippets/snippet.ts {*}{lines:true}

---

# Code group

::code-group

```sh [npm]
npm i slide-ng
```

```sh [yarn]
yarn add slide-ng
```

::

---

# Magic move

````md magic-move
```js {*|1|2-3}
let count = 1
function add() {
  count++
}
```

```ts {*}{lines:true}
let count: number = 1
const add = () => count += 1
console.log(add())
```
````

<div v-click id="after-magic">after magic</div>

---

# Math

Inline $\sqrt{3x-1}+(1+x)^2$ and a price of $5 and $10 stay text, `$HOME` too.

$$
\begin{aligned}
a &= {{b}} \\
c &= d
\end{aligned}
$$

$$ {1|2|all}
\begin{aligned}
\nabla \cdot \vec{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \vec{B} &= 0 \\
\nabla \times \vec{E} &= -\frac{\partial\vec{B}}{\partial t}
\end{aligned}
$$

---

# Diagrams

```mermaid {theme:'neutral', scale:0.8}
graph TD
B[Text] --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E{{Result 2}}
```

<mermaid id="direct" code="pie title Pets&#10;&quot;Dogs&quot; : 3&#10;&quot;Cats&quot; : 2" />

```plantuml
@startuml
Alice -> Bob : Hello!
@enduml
```

---

# Monaco

```ts {monaco}
const message: string = 'edit me'
console.log(message)
```

```ts {monaco-diff}
console.log('Original text')
~~~
console.log('Modified text')
```

---

# Monaco run

```ts {monaco-run}
function distance(x: number, y: number) {
  return Math.sqrt(x ** 2 + y ** 2)
}
console.log(distance(3, 4), [1, 2], { a: 1 }, new Map([[1, 2]]))
```

```ts {monaco-run} {autorun:false,showOutputAt:'+1'}
console.log('shown after one click')
throw new Error('boom')
```

```js {monaco-run}
try { console.log(parent.document.title) } catch (e) { console.log(e.name) }
console.log(typeof localStorage === 'undefined' ? 'no storage' : (() => { try { localStorage.length; return 'has storage' } catch (e) { return e.name } })())
```

---

# Twoslash

```ts twoslash
const count = Math.max(1, 2)
//    ^?
interface Point { x: number }
const p: Point = { x: 1 }
p.x
//^?
```

```ts {1}
const plain = 'no twoslash here'
```

---

# Components

<arrow id="a1" x1="100" y1="300" x2="300" y2="400" color="green" width="3" />
<arrow id="a2" x1="400" y1="300" x2="500" y2="300" two-way />

<transform id="t1" scale="0.5" origin="top left">

<div id="t1-inner" class="w-40 h-10 bg-gray-200">scaled</div>

</transform>

<auto-fit-text id="fit" class="w-60 h-20 bg-gray-100" min="10" max="60">Some text that should fit its box</auto-fit-text>

<youtube id="luoMHjh-XcQ" width="320" height="180" />

---

# Video and embeds

<slide-video id="vid" v-click autoplay="true" autoreset="click" controls>
  <source src="/missing.webm" type="video/webm" />
</slide-video>

<slide-video id="vid-once" v-click autoplay="once"></slide-video>

<tweet id="20" scale="0.5" />

<blue-sky uri="at://did:plc:432mbsu2xucyvxl6sluohidu/app.bsky.feed.post/3lgwg2vy44s2q" />
