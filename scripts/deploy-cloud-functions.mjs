#!/usr/bin/env node
/**
 * 部署 AI 云函数，并从 .env.local 注入密钥类环境变量。
 * cloudbaserc.json 不含 AI_API_KEY，避免误提交；部署时临时合并后删除。
 */
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvLocal() {
  const content = readFileSync(join(root, ".env.local"), "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

const env = parseEnvLocal();
if (!env.AI_API_KEY) {
  console.error("错误：.env.local 中缺少 AI_API_KEY，无法部署 AI 云函数");
  process.exit(1);
}

const baseUrl =
  env.AI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";

const configPath = join(root, "cloudbaserc.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

for (const fn of config.functions ?? []) {
  if (fn.name === "ai-analyze-pattern") {
    fn.envVariables = {
      AI_MODEL: env.AI_MODEL || fn.envVariables?.AI_MODEL || "qwen3.7-plus",
      AI_BASE_URL: baseUrl,
      AI_API_KEY: env.AI_API_KEY,
    };
  }
  if (fn.name === "ai-generate-insights") {
    fn.envVariables = {
      AI_MODEL_INSIGHTS:
        env.AI_MODEL_INSIGHTS ||
        fn.envVariables?.AI_MODEL_INSIGHTS ||
        "qwen3.7-max",
      AI_BASE_URL: baseUrl,
      AI_API_KEY: env.AI_API_KEY,
    };
  }
}

const tempPath = join(root, ".cloudbaserc.deploy.json");
writeFileSync(tempPath, JSON.stringify(config, null, 2) + "\n");

const fnNames =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ["ai-analyze-pattern", "ai-generate-insights"];

try {
  for (const name of fnNames) {
    console.log(`[deploy] 部署云函数: ${name}`);
    execSync(`tcb fn deploy ${name} --force --config-file "${tempPath}"`, {
      cwd: root,
      stdio: "inherit",
    });
    // fn deploy 有时不会刷新 envVariables，需单独推送配置
    console.log(`[deploy] 更新环境变量: ${name}`);
    execSync(`printf '\\n' | tcb config update fn ${name} --config-file "${tempPath}"`, {
      cwd: root,
      stdio: "inherit",
    });
  }
  console.log("[deploy] 完成（AI_API_KEY 已从 .env.local 注入，未写入仓库）");
} finally {
  try {
    unlinkSync(tempPath);
  } catch {
    /* ignore */
  }
}
