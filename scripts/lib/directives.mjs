// Slidev writes `v-mark.red.circle="2"` and `v-motion :initial="{ x: 0 }"`. Those are Vue
// forms Angular cannot read, so this turns them into plain Angular attributes:
//   v-mark.red.circle="2"     ->  mark-mods="red.circle" v-mark="2"
//   v-mark="{ at: 2 }"        ->  [v-mark]="{ at: 2 }"
//   v-motion :initial=".." :click-1=".."  ->  [v-motion]="{ initial: .., 'click-1': .. }"

const TAG = /<([a-z][\w-]*)((?:\s+[^\s=>"'/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>/g;
const ATTR = /\s+([^\s=>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
const VARIANT = /^:(initial|enter|leave|click-\d+(?:-\d+)?)$/;

/** @param {string} html markdown with code already taken out */
export function rewriteDirectives(html) {
  return html.replace(TAG, (tag, name, attrText, close) => {
    if (!/\sv-(mark|motion)\b/.test(attrText)) return tag;
    const attrs = [...attrText.matchAll(ATTR)].map((m) => ({
      name: m[1],
      value: m[2] ?? m[3],
      quote: m[3] != null ? "'" : '"',
    }));
    const out = [];
    const variants = [];
    let motion = false;
    for (const a of attrs) {
      const variant = VARIANT.exec(a.name);
      if (/^v-mark(\.|$)/.test(a.name)) out.push(...markAttrs(a));
      else if (a.name === 'v-motion') motion = true;
      else if (variant) variants.push(`'${variant[1]}': (${a.value})`);
      else if (/^:(hovered|tapped|focused|visible|variants)/.test(a.name))
        console.warn(`[slide.ng] v-motion does not support ${a.name}, it is ignored`);
      else out.push(a.value == null ? a.name : `${a.name}=${a.quote}${a.value}${a.quote}`);
    }
    if (motion) out.push(`[v-motion]="{ ${variants.join(', ')} }"`);
    return `<${name} ${out.join(' ')}${close ? ' /' : ''}>`;
  });
}

// One v-mark attribute -> the attributes Angular needs.
function markAttrs(a) {
  const [, mods = ''] = /^v-mark\.?(.*)$/.exec(a.name);
  const out = mods ? [`mark-mods="${mods}"`] : [];
  const value = a.value?.trim();
  if (value && /^[{[]/.test(value))
    out.push(`[v-mark]="${value}"`); // an object or a range: Vue expression
  else if (value && /^'.*'$/.test(value))
    out.push(`v-mark="${value.slice(1, -1)}"`); // v-mark="'+1'"
  else out.push(value == null ? 'v-mark' : `v-mark="${value}"`);
  return out;
}
