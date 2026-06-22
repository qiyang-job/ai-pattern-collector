import {
  COMPONENT_FAMILIES,
  EMPTY_LENS_SCORE,
  JOURNEY_STAGES,
  PATTERN_CATEGORIES,
  PATTERN_CATEGORY_MIGRATION_MAP,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_MIGRATION_MAP,
  REUSE_LEVELS,
  SCREENSHOT_STATES,
  SCREENSHOT_STATE_MIGRATION_MAP,
  migrateEnum,
} from "@/lib/constants";
import type {
  ComponentFamily,
  LensScore,
  LensScoreValue,
  PatternRecord,
  ScreenshotState,
} from "@/lib/types";

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

/** 归一次要界面状态数组：逐项迁移旧值，过滤掉无法识别（Unknown 兜底后去重）的项 */
function normalizeSecondaryStates(
  raw: unknown,
  primary: ScreenshotState,
): ScreenshotState[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<ScreenshotState>();
  const out: ScreenshotState[] = [];
  for (const item of raw) {
    const migrated = migrateEnum(
      item,
      SCREENSHOT_STATES,
      SCREENSHOT_STATE_MIGRATION_MAP,
      "Unknown",
    );
    // 去重、剔除与主状态相同的项、剔除 Unknown 噪声
    if (migrated === "Unknown" || migrated === primary || seen.has(migrated)) continue;
    seen.add(migrated);
    out.push(migrated);
  }
  return out;
}

/**
 * 将来自数据库 / 导入 / 任意来源的原始对象，归一化为字段完整的 PatternRecord。
 * 防止脏记录（缺字段、空值被传输层丢弃、枚举非法）导致下游统计 / 渲染崩溃。
 */
export function normalizeRecord(raw: unknown): PatternRecord {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const screenshotState = migrateEnum(
    r.screenshotState,
    SCREENSHOT_STATES,
    SCREENSHOT_STATE_MIGRATION_MAP,
    "Unknown",
  );
  return {
    id: str(r.id),
    screenshotId: str(r.screenshotId),
    imageDataUrl: str(r.imageDataUrl),
    extraImages: Array.isArray(r.extraImages)
      ? r.extraImages.filter((url): url is string => typeof url === "string" && url.length > 0)
      : undefined,
    imageFileID: typeof r.imageFileID === "string" ? r.imageFileID : undefined,
    videoFileID: typeof r.videoFileID === "string" ? r.videoFileID : undefined,
    videoName: typeof r.videoName === "string" ? r.videoName : undefined,
    videoMime: typeof r.videoMime === "string" ? r.videoMime : undefined,
    rawNote: str(r.rawNote),
    sourceUrl: typeof r.sourceUrl === "string" ? r.sourceUrl : undefined,
    taskContext: typeof r.taskContext === "string" ? r.taskContext : undefined,
    patternId: str(r.patternId),
    patternName: str(r.patternName),
    componentFamily: oneOf(
      [...COMPONENT_FAMILIES, ""] as const,
      r.componentFamily,
      "",
    ) as ComponentFamily | "",
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
    productCategory: migrateEnum(
      r.productCategory,
      PRODUCT_CATEGORIES,
      PRODUCT_CATEGORY_MIGRATION_MAP,
      "AI Chat",
    ),
    journeyStage: oneOf(JOURNEY_STAGES, r.journeyStage, "J-01 Entry"),
    screenshotState,
    secondaryScreenshotStates: normalizeSecondaryStates(
      r.secondaryScreenshotStates,
      screenshotState,
    ),
    screenshotStateReason: str(r.screenshotStateReason),
    patternCategory: migrateEnum(
      r.patternCategory,
      PATTERN_CATEGORIES,
      PATTERN_CATEGORY_MIGRATION_MAP,
      "Intent Input Patterns",
    ),
    lensScore: normalizeLensScore(r.lensScore),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  };
}
