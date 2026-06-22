import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const xlsxPath =
  process.argv[2] ||
  path.resolve(process.env.HOME, "Downloads/[通用] 色彩 Color.xlsx");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "wecom-color-data.json");

function parseColor(raw) {
  const s = String(raw || "")
    .trim()
    .toUpperCase();
  if (!s) return null;
  const m = s.match(/^([0-9A-F]{6})(?:\s+(\d+)%)?$/);
  if (!m) return null;
  const hex = m[1];
  const a = m[2] ? Number(m[2]) / 100 : 1;
  return {
    hex,
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
    a,
  };
}

let XLSX;
try {
  XLSX = require("xlsx");
} catch {
  console.error("请先安装 xlsx: npm install xlsx");
  process.exit(1);
}

const wb = XLSX.readFile(xlsxPath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

const colors = [];
for (const row of rows.slice(1)) {
  const display = String(row[0] || "").trim();
  const name = String(row[1] || "").trim();
  if (!name) continue;
  const light = parseColor(row[2]);
  const dark = parseColor(row[3]);
  if (!light || !dark) {
    console.warn("跳过无法解析的行:", name, row[2], row[3]);
    continue;
  }
  colors.push({
    display,
    name,
    usage: String(row[4] || "").trim(),
    light,
    dark,
  });
}

fs.writeFileSync(outPath, JSON.stringify(colors, null, 2), "utf8");
console.log(`已写入 ${colors.length} 条颜色到 ${outPath}`);
