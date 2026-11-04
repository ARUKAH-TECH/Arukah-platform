// Makes the Tailwind CSS work on older phones (Chrome/Android WebView before
// 2022, Samsung Internet, Safari 14). Runs after Tailwind:
//  1. Unwraps @layer blocks. Older browsers ignore everything inside @layer,
//     which would leave the page unstyled. Tailwind already writes the layers
//     in the right order, so the result looks the same on new phones.
//  2. Adds a `transform` fallback for the newer `translate` / `scale` /
//     `rotate` properties, only for browsers that don't support them.
//  3. Adds a `vh` fallback before `dvh` / `svh` / `lvh` sizes.
// No extra packages needed.

function splitTop(value) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of value.trim()) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === " " && depth === 0) {
      if (cur) out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

const FN = { translate: "translate", scale: "scale", rotate: "rotate" };

module.exports = () => ({
  postcssPlugin: "old-phones",
  OnceExit(root, { AtRule, Rule, Declaration }) {
    // 1. @layer
    root.walkAtRules("layer", (at) => {
      if (at.nodes && at.nodes.length) at.replaceWith(at.nodes);
      else at.remove();
    });

    // 3. dvh/svh/lvh
    root.walkDecls((decl) => {
      if (/\d(d|s|l)vh\b/.test(decl.value) && !decl.value.includes("var(")) {
        const prev = decl.prev();
        if (!(prev && prev.type === "decl" && prev.prop === decl.prop)) {
          decl.cloneBefore({ value: decl.value.replace(/(\d)(d|s|l)vh\b/g, "$1vh") });
        }
      }
    });

    // 2. translate / scale / rotate
    root.walkRules((rule) => {
      if (rule.parent && rule.parent.type === "atrule" && /^(keyframes|-webkit-keyframes|supports)$/.test(rule.parent.name)) return;
      const parts = [];
      rule.each((node) => {
        if (node.type !== "decl" || !FN[node.prop]) return;
        if (node.value === "none") return;
        const args = splitTop(node.value);
        parts.push(`${FN[node.prop]}(${args.join(", ")})`);
      });
      if (!parts.length) return;
      const fallback = new Rule({ selector: rule.selector });
      fallback.append(new Declaration({ prop: "transform", value: parts.join(" ") }));
      const supports = new AtRule({ name: "supports", params: "not (translate: 0)" });
      supports.append(fallback);
      rule.after(supports);
    });
  },
});
module.exports.postcss = true;
