import { z } from "zod";
import {
  JOURNEY_STAGES,
  PATTERN_CATEGORIES,
  PRODUCT_CATEGORIES,
  REUSE_LEVELS,
  SCREENSHOT_STATES,
} from "@/lib/constants";

const scoreSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

export const LensScoreSchema = z.object({
  intentClarity: scoreSchema,
  contextVisibility: scoreSchema,
  processTransparency: scoreSchema,
  userControl: scoreSchema,
  trustBuilding: scoreSchema,
  errorRecoverability: scoreSchema,
  outputUsability: scoreSchema,
  reusability: scoreSchema,
});

export const AnalyzePatternRequestSchema = z.object({
  imageDataUrl: z.string().min(1, "请先上传或粘贴截图"),
  rawNote: z.string().min(1, "Raw Note 是必填项"),
  product: z.string().optional(),
  sourceUrl: z.string().optional(),
  taskContext: z.string().optional(),
});

export const AnalyzePatternResponseSchema = z.object({
  product: z.string(),
  productCategory: z.enum(PRODUCT_CATEGORIES),
  journeyStage: z.enum(JOURNEY_STAGES),
  screenshotState: z.enum(SCREENSHOT_STATES),
  patternName: z.string(),
  patternCategory: z.enum(PATTERN_CATEGORIES),
  userProblem: z.string(),
  aiCapability: z.string(),
  uiAnatomy: z.string(),
  interactionRule: z.string(),
  systemFeedback: z.string(),
  trustMechanism: z.string(),
  failureHandling: z.string(),
  reuseLevel: z.enum(REUSE_LEVELS),
  designJudgment: z.string(),
  lensScore: LensScoreSchema,
  tags: z.array(z.string()),
});

export const GenerateInsightsRequestSchema = z.object({
  records: z.array(
    z.object({
      patternId: z.string(),
      screenshotId: z.string(),
      product: z.string(),
      productCategory: z.enum(PRODUCT_CATEGORIES),
      journeyStage: z.enum(JOURNEY_STAGES),
      screenshotState: z.enum(SCREENSHOT_STATES),
      patternName: z.string(),
      patternCategory: z.enum(PATTERN_CATEGORIES),
      userProblem: z.string(),
      aiCapability: z.string(),
      trustMechanism: z.string(),
      reuseLevel: z.enum(REUSE_LEVELS),
      designJudgment: z.string(),
      lensScore: LensScoreSchema,
      tags: z.array(z.string()),
    }),
  ),
});

export const GenerateInsightsResponseSchema = z.object({
  researchScope: z.string(),
  productCoverage: z.string(),
  journeyCoverage: z.string(),
  highValuePatterns: z.string(),
  crossProductComparison: z.string(),
  stageMaturity: z.string(),
  designOpportunities: z.string(),
  recommendations: z.string(),
});

/**
 * 将 AI 返回中可能不规范的枚举值映射到合法枚举。
 * 无法映射时返回 undefined（保留原值，交给 Zod 校验失败）。
 */
function mapEnum<T extends string>(
  value: unknown,
  options: readonly T[],
): T | undefined {
  if (typeof value !== "string") return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  // 精确匹配（忽略大小写）
  const exact = options.find((o) => o.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  // Journey Stage：按 J-0x 编码前缀匹配
  const codeMatch = raw.match(/J[-\s]?0?(\d)/i);
  if (codeMatch) {
    const byCode = options.find((o) => o.startsWith(`J-0${codeMatch[1]}`));
    if (byCode) return byCode;
  }
  // 包含匹配（双向）
  const partial = options.find(
    (o) =>
      raw.toLowerCase().includes(o.toLowerCase()) ||
      o.toLowerCase().includes(raw.toLowerCase()),
  );
  return partial;
}

function clampScore(value: unknown): 0 | 1 | 2 | 3 {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  const r = Math.round(n);
  return (r < 0 ? 0 : r > 3 ? 3 : r) as 0 | 1 | 2 | 3;
}

/**
 * 在 Zod 校验前对 AI 返回做归一化：
 * - 枚举字段尝试映射到合法值
 * - lensScore 每项 clamp 到 0/1/2/3
 * - tags 保证为 string[]
 */
export function normalizeAnalyzePayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...payload };

  out.productCategory = mapEnum(payload.productCategory, PRODUCT_CATEGORIES) ?? payload.productCategory;
  out.journeyStage = mapEnum(payload.journeyStage, JOURNEY_STAGES) ?? payload.journeyStage;
  out.screenshotState = mapEnum(payload.screenshotState, SCREENSHOT_STATES) ?? payload.screenshotState;
  out.patternCategory = mapEnum(payload.patternCategory, PATTERN_CATEGORIES) ?? payload.patternCategory;
  out.reuseLevel = mapEnum(payload.reuseLevel, REUSE_LEVELS) ?? payload.reuseLevel;

  const ls = (payload.lensScore ?? {}) as Record<string, unknown>;
  out.lensScore = {
    intentClarity: clampScore(ls.intentClarity),
    contextVisibility: clampScore(ls.contextVisibility),
    processTransparency: clampScore(ls.processTransparency),
    userControl: clampScore(ls.userControl),
    trustBuilding: clampScore(ls.trustBuilding),
    errorRecoverability: clampScore(ls.errorRecoverability),
    outputUsability: clampScore(ls.outputUsability),
    reusability: clampScore(ls.reusability),
  };

  out.tags = Array.isArray(payload.tags)
    ? payload.tags.filter((t): t is string => typeof t === "string")
    : [];

  return out;
}
