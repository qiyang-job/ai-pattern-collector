/**
 * 批量更新 WeCom Text Style 的默认字体族：
 * - WeCom/Desktop/*  → Microsoft YaHei（Windows 桌面）
 * - WeCom/Mac/*      → PingFang SC（Mac 桌面，若不存在则从 Desktop 克隆）
 * - WeCom/Mobile/*   → PingFang SC（移动端）
 *
 * 在 Figma MCP use_figma 中整段作为 code 执行。
 * 前置：Figma 桌面端已安装并可选用 微软雅黑 / PingFang SC（FigmaAgent 已同步本地字体）。
 */
const MODE = "apply"; // "audit" | "apply" | "create-mac"

const DESKTOP_FAMILY = "Microsoft YaHei";
const MAC_FAMILY = "PingFang SC";
const MOBILE_FAMILY = "PingFang SC";

function mapInterStyleToTarget(interStyle, family) {
  const s = interStyle || "Regular";
  if (family === DESKTOP_FAMILY) {
    if (/bold|semi/i.test(s)) return "Bold";
    if (/light/i.test(s)) return "Light";
    return "Regular";
  }
  // PingFang SC
  if (/bold|semi/i.test(s)) return "Semibold";
  if (/medium/i.test(s)) return "Medium";
  if (/light/i.test(s)) return "Light";
  return "Regular";
}

function targetFontForStyle(style, family) {
  return {
    family,
    style: mapInterStyleToTarget(style.fontName.style, family),
  };
}

function platformForStyleName(name) {
  if (name.startsWith("WeCom/Desktop/")) return "desktop";
  if (name.startsWith("WeCom/Mac/")) return "mac";
  if (name.startsWith("WeCom/Mobile/")) return "mobile";
  return null;
}

function familyForPlatform(platform) {
  if (platform === "desktop") return DESKTOP_FAMILY;
  if (platform === "mac") return MAC_FAMILY;
  if (platform === "mobile") return MOBILE_FAMILY;
  return null;
}

async function ensureFontLoaded(fontName) {
  await figma.loadFontAsync(fontName);
}

const allStyles = await figma.getLocalTextStylesAsync();
const wecomStyles = allStyles.filter((s) => s.name.startsWith("WeCom/"));

if (MODE === "create-mac") {
  const desktopStyles = wecomStyles.filter((s) => s.name.startsWith("WeCom/Desktop/"));
  const existingMac = new Set(
    wecomStyles.filter((s) => s.name.startsWith("WeCom/Mac/")).map((s) => s.name),
  );
  const created = [];
  const skipped = [];
  for (const src of desktopStyles) {
    const macName = src.name.replace("WeCom/Desktop/", "WeCom/Mac/");
    if (existingMac.has(macName)) {
      skipped.push(macName);
      continue;
    }
    const font = targetFontForStyle(src, MAC_FAMILY);
    await ensureFontLoaded(font);
    await ensureFontLoaded(src.fontName);
    const style = figma.createTextStyle();
    style.name = macName;
    style.fontSize = src.fontSize;
    style.lineHeight = src.lineHeight;
    style.letterSpacing = src.letterSpacing;
    style.paragraphSpacing = src.paragraphSpacing;
    style.textDecoration = src.textDecoration;
    style.textCase = src.textCase;
    style.fontName = font;
    style.description = (src.description || "").replace(/desktop/gi, "mac");
    created.push(macName);
  }
  return { mode: MODE, createdCount: created.length, skippedCount: skipped.length, created, skipped };
}

const plan = [];
const loadSet = new Map();

for (const style of wecomStyles) {
  const platform = platformForStyleName(style.name);
  if (!platform) continue;
  const family = familyForPlatform(platform);
  const next = targetFontForStyle(style, family);
  const cur = style.fontName;
  if (cur.family === next.family && cur.style === next.style) continue;
  plan.push({
    id: style.id,
    name: style.name,
    platform,
    from: cur,
    to: next,
  });
  loadSet.set(`${cur.family}|||${cur.style}`, cur);
  loadSet.set(`${next.family}|||${next.style}`, next);
}

if (MODE === "audit") {
  return {
    mode: MODE,
    wecomStyleCount: wecomStyles.length,
    pendingUpdates: plan.length,
    sample: plan.slice(0, 8),
    fontsToLoad: [...loadSet.values()],
  };
}

const loadErrors = [];
for (const font of loadSet.values()) {
  try {
    await ensureFontLoaded(font);
  } catch (e) {
    loadErrors.push({ font, error: String(e) });
  }
}

if (loadErrors.length) {
  return {
    mode: MODE,
    error: "fonts_not_available",
    loadErrors,
    hint: "请在 Figma 桌面端确认已安装 微软雅黑 与 PingFang SC，并重启 Figma / FigmaAgent 后重试。",
    pendingUpdates: plan.length,
  };
}

const updated = [];
for (const item of plan) {
  const style = wecomStyles.find((s) => s.id === item.id);
  if (!style) continue;
  style.fontName = item.to;
  updated.push(item.name);
}

return {
  mode: MODE,
  updatedCount: updated.length,
  updated,
};
