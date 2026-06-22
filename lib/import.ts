import { z } from "zod";
import { GenerateInsightsResponseSchema, LensScoreSchema } from "@/lib/ai/schemas";
import {
  COMPONENT_FAMILIES,
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
  InsightsResult,
  PatternRecord,
  ProductCategory,
  PatternCategory,
  ScreenshotState,
} from "@/lib/types";

/** 导入时把旧枚举值预迁移成新值，避免历史备份因旧值校验失败 */
const productCategoryField = z.preprocess(
  (v) => migrateEnum(v, PRODUCT_CATEGORIES, PRODUCT_CATEGORY_MIGRATION_MAP, "AI Chat") as ProductCategory,
  z.enum(PRODUCT_CATEGORIES),
);
const screenshotStateField = z.preprocess(
  (v) => migrateEnum(v, SCREENSHOT_STATES, SCREENSHOT_STATE_MIGRATION_MAP, "Unknown") as ScreenshotState,
  z.enum(SCREENSHOT_STATES),
);
const patternCategoryField = z.preprocess(
  (v) =>
    migrateEnum(
      v,
      PATTERN_CATEGORIES,
      PATTERN_CATEGORY_MIGRATION_MAP,
      "Intent Input Patterns",
    ) as PatternCategory,
  z.enum(PATTERN_CATEGORIES),
);
const componentFamilyField = z.preprocess(
  (v) => {
    if (v === null || v === undefined || v === "") return "" as const;
    if (typeof v === "string" && (COMPONENT_FAMILIES as readonly string[]).includes(v)) {
      return v as ComponentFamily;
    }
    return "" as const;
  },
  z.union([z.literal(""), z.enum(COMPONENT_FAMILIES)]),
);
const secondaryStatesField = z.preprocess(
  (v) =>
    Array.isArray(v)
      ? v.map((s) =>
          migrateEnum(s, SCREENSHOT_STATES, SCREENSHOT_STATE_MIGRATION_MAP, "Unknown"),
        )
      : [],
  z.array(z.enum(SCREENSHOT_STATES)),
);

export type ImportMode = "merge" | "replace";

export const PatternRecordSchema = z
  .object({
    id: z.string().min(1),
    screenshotId: z.string().min(1),
    imageDataUrl: z.string().default(""),
    extraImages: z.array(z.string().min(1)).optional(),
    videoFileID: z.string().optional(),
    videoName: z.string().optional(),
    videoMime: z.string().optional(),
    rawNote: z.string(),
  sourceUrl: z.string().optional(),
  taskContext: z.string().optional(),
  patternId: z.string().min(1),
  patternName: z.string(),
  componentFamily: componentFamilyField.optional().default(""),
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
  productCategory: productCategoryField,
  journeyStage: z.enum(JOURNEY_STAGES),
  screenshotState: screenshotStateField,
  secondaryScreenshotStates: secondaryStatesField.optional().default([]),
  screenshotStateReason: z.string().optional().default(""),
  patternCategory: patternCategoryField,
  lensScore: LensScoreSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .refine((r) => r.imageDataUrl.length > 0 || Boolean(r.videoFileID), {
    message: "每条记录需包含截图或录屏证据",
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
