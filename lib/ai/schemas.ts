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
