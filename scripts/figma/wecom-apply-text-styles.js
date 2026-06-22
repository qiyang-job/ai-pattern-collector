/**
 * 将设计稿文字统一套用文件内预设 WeCom Text Style（不用排版变量）。
 * 在 Figma MCP use_figma 中执行，可修改 ROOT_ID 或改为遍历全文件。
 */
const ROOT_ID = "23:1431"; // 设为 null 则处理所有页面

function isStrong(seg) {
  const w = typeof seg.fontWeight === "number" ? seg.fontWeight : 400;
  const style = seg.fontName?.style || "";
  if (w >= 600 || w === 500) return true;
  return /bold|semibold|semi bold|medium|heavy|black/i.test(style);
}

function nodeProfile(node) {
  const segs = node.getStyledTextSegments(["fontSize", "fontName", "fontWeight"]);
  if (!segs.length) return { size: 14, strong: false };
  if (segs.length === 1) {
    return { size: Math.round(segs[0].fontSize), strong: isStrong(segs[0]) };
  }
  let total = 0;
  let wSize = 0;
  let strongChars = 0;
  for (const s of segs) {
    const len = Math.max(0, (s.end ?? 0) - (s.start ?? 0));
    total += len;
    wSize += Math.round(s.fontSize) * len;
    if (isStrong(s)) strongChars += len;
  }
  if (!total) return { size: Math.round(segs[0].fontSize), strong: isStrong(segs[0]) };
  return { size: Math.round(wSize / total), strong: strongChars > total / 2 };
}

function styleIsStrong(name, fontName) {
  if (/strong|bold|强化/i.test(name)) return true;
  return /bold|semibold|semi bold|medium|heavy|black/i.test(fontName?.style || "");
}

function usesMobileContext(node) {
  let p = node.parent;
  while (p) {
    if (/mobile/i.test(p.name)) return true;
    p = p.parent;
  }
  return false;
}

function walk(node, out = []) {
  if (node.type === "TEXT") out.push(node);
  if ("children" in node) for (const c of node.children) walk(c, out);
  return out;
}

const allStyles = await figma.getLocalTextStylesAsync();
const desktopPool = allStyles.filter(
  (s) =>
    s.name.startsWith("WeCom/Desktop/") &&
    !/文章|短文|Message Bubble|Article|Prose/i.test(s.name),
);
const mobilePool = allStyles.filter(
  (s) =>
    s.name.startsWith("WeCom/Mobile/") &&
    !/文章|短文|Message Bubble|Article|Prose/i.test(s.name),
);

function makeBuckets(pool) {
  return pool.map((s) => ({
    style: s,
    size: Math.round(s.fontSize),
    strong: styleIsStrong(s.name, s.fontName),
  }));
}

const desktopBuckets = makeBuckets(desktopPool);
const mobileBuckets = makeBuckets(mobilePool);

function pickStyle(size, strong, buckets) {
  const candidates = buckets.filter((b) => b.strong === strong);
  const list = candidates.length ? candidates : buckets;
  let best = list[0];
  let bestDiff = Infinity;
  for (const b of list) {
    const diff = Math.abs(b.size - size);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = b;
    }
  }
  return best?.style;
}

const texts = [];
if (ROOT_ID) {
  const root = await figma.getNodeByIdAsync(ROOT_ID);
  if (!root) return { error: `Node ${ROOT_ID} not found` };
  walk(root, texts);
} else {
  for (const page of figma.root.children) walk(page, texts);
}

const fontKeys = new Set();
for (const t of texts) {
  for (const f of t.getRangeAllFontNames(0, t.characters.length)) {
    fontKeys.add(`${f.family}::${f.style}`);
  }
}
for (const s of [...desktopPool, ...mobilePool]) {
  fontKeys.add(`${s.fontName.family}::${s.fontName.style}`);
}
await Promise.all(
  [...fontKeys].map((k) => {
    const [family, style] = k.split("::");
    return figma.loadFontAsync({ family, style });
  }),
);

const mutatedNodeIds = [];
const styleUsage = {};

for (const t of texts) {
  const { size, strong } = nodeProfile(t);
  const buckets = usesMobileContext(t) ? mobileBuckets : desktopBuckets;
  const style = pickStyle(size, strong, buckets);
  if (!style) continue;

  // 仅套用 Text Style，不绑定排版变量
  const fields = [
    "fontFamily",
    "fontStyle",
    "fontSize",
    "lineHeight",
    "fontWeight",
    "letterSpacing",
  ];
  for (const field of fields) {
    try {
      t.setBoundVariable(field, null);
    } catch {
      /* ignore */
    }
  }

  await t.setTextStyleIdAsync(style.id);
  mutatedNodeIds.push(t.id);
  styleUsage[style.name] = (styleUsage[style.name] || 0) + 1;
}

return {
  mutatedNodeIds,
  styledCount: mutatedNodeIds.length,
  totalTexts: texts.length,
  styleUsage,
};
