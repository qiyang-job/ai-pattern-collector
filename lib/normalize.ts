import {
  EMPTY_LENS_SCORE,
  JOURNEY_STAGES,
  PATTERN_CATEGORIES,
  PRODUCT_CATEGORIES,
  REUSE_LEVELS,
  SCREENSHOT_STATES,
} from "@/lib/constants";
import type { LensScore, LensScoreValue, PatternRecord } from "@/lib/types";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function clampScore(v: unknown): LensScoreValue {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
  return (n < 0 ? 0 : n > 3 ? 3 : n) as LensScoreValue;
}

/** 保证 lensScore 始终是含全部 8 个维度的完整对象（CloudBase 传输层会丢弃空值属性） */
export function normalizeLensScore(raw: unknown): LensScore {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = { ...EMPTY_LENS_SCORE };
  (Object.keys(EMPTY_LENS_SCORE) as Array<keyof LensScore>).forEach((k) => {
    out[k] = clampScore(src[k]);
  });
  return out;
}

function oneOf<T extends readonly string[]>(
  list: T,
  v: unknown,
  fallback: T[number],
): T[number] {
  return typeof v === "string" && (list as readonly string[]).includes(v)
    ? (v as T[number])
    : fallback;
}

/**
 * 将来自数据库 / 导入 / 任意来源的原始对象，归一化为字段完整的 PatternRecord。
 * 防止脏记录（缺字段、空值被传输层丢弃、枚举非法）导致下游统计 / 渲染崩溃。
 */
export function normalizeRecord(raw: unknown): PatternRecord {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    screenshotId: str(r.screenshotId),
    imageDataUrl: str(r.imageDataUrl),
    imageFileID: typeof r.imageFileID === "string" ? r.imageFileID : undefined,
    rawNote: str(r.rawNote),
    sourceUrl: typeof r.sourceUrl === "string" ? r.sourceUrl : undefined,
    taskContext: typeof r.taskContext === "string" ? r.taskContext : undefined,
    patternId: str(r.patternId),
    patternName: str(r.patternName),
    userProblem: str(r.userProblem),
    aiCapability: str(r.aiCapability),
    uiAnatomy: str(r.uiAnatomy),
    interactionRule: str(r.interactionRule),
    systemFeedback: str(r.systemFeedback),
    trustMechanism: str(r.trustMechanism),
    failureHandling: str(r.failureHandling),
    reuseLevel: oneOf(REUSE_LEVELS, r.reuseLevel, "Medium"),
    designJudgment: str(r.designJudgment),
    tags: Array.isArray(r.tags)
      ? r.tags.filter((t): t is string => typeof t === "string")
      : [],
    product: str(r.product),
    productCategory: oneOf(PRODUCT_CATEGORIES, r.productCategory, "AI Chat"),
    journeyStage: oneOf(JOURNEY_STAGES, r.journeyStage, "J-01 Entry"),
    screenshotState: oneOf(SCREENSHOT_STATES, r.screenshotState, "Default"),
    patternCategory: oneOf(PATTERN_CATEGORIES, r.patternCategory, "Intent Input Patterns"),
    lensScore: normalizeLensScore(r.lensScore),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  };
}
