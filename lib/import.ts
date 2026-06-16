import { z } from "zod";
import { GenerateInsightsResponseSchema, LensScoreSchema } from "@/lib/ai/schemas";
import {
  JOURNEY_STAGES,
  PATTERN_CATEGORIES,
  PRODUCT_CATEGORIES,
  REUSE_LEVELS,
  SCREENSHOT_STATES,
} from "@/lib/constants";
import type { InsightsResult, PatternRecord } from "@/lib/types";

export type ImportMode = "merge" | "replace";

export const PatternRecordSchema = z.object({
  id: z.string().min(1),
  screenshotId: z.string().min(1),
  imageDataUrl: z.string().min(1),
  rawNote: z.string(),
  sourceUrl: z.string().optional(),
  taskContext: z.string().optional(),
  patternId: z.string().min(1),
  patternName: z.string(),
  userProblem: z.string(),
  aiCapability: z.string(),
  uiAnatomy: z.string(),
  interactionRule: z.string(),
  systemFeedback: z.string(),
  trustMechanism: z.string(),
  failureHandling: z.string(),
  reuseLevel: z.enum(REUSE_LEVELS),
  designJudgment: z.string(),
  tags: z.array(z.string()),
  product: z.string(),
  productCategory: z.enum(PRODUCT_CATEGORIES),
  journeyStage: z.enum(JOURNEY_STAGES),
  screenshotState: z.enum(SCREENSHOT_STATES),
  patternCategory: z.enum(PATTERN_CATEGORIES),
  lensScore: LensScoreSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const BackupBundleSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  records: z.array(PatternRecordSchema),
  insights: GenerateInsightsResponseSchema.nullable().optional(),
});

export type ImportPayload = {
  records: PatternRecord[];
  insights: InsightsResult | null;
};

export type ImportParseResult =
  | { ok: true; payload: ImportPayload }
  | { ok: false; error: string };

function parseRecordsArray(raw: unknown): z.ZodSafeParseResult<PatternRecord[]> {
  return z.array(PatternRecordSchema).safeParse(raw);
}

export function parseImportJson(text: string): ImportParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON 解析失败，请确认文件格式正确。" };
  }

  if (Array.isArray(parsed)) {
    const records = parseRecordsArray(parsed);
    if (!records.success) {
      return {
        ok: false,
        error: "记录字段校验失败，请使用本系统导出的 JSON 完整备份。",
      };
    }
    return { ok: true, payload: { records: records.data, insights: null } };
  }

  const bundle = BackupBundleSchema.safeParse(parsed);
  if (!bundle.success) {
    return {
      ok: false,
      error: "备份格式无效，请使用本系统导出的 JSON 文件。",
    };
  }

  return {
    ok: true,
    payload: {
      records: bundle.data.records,
      insights: bundle.data.insights ?? null,
    },
  };
}

export function summarizeImportPayload(payload: ImportPayload) {
  const products = new Set(payload.records.map((record) => record.product).filter(Boolean));
  return {
    recordCount: payload.records.length,
    productCount: products.size,
    hasInsights: Boolean(payload.insights),
  };
}
