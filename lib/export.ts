import { JOURNEY_STAGES, PATTERN_CATEGORIES, PRODUCT_CATEGORIES, SCREENSHOT_STATES } from "@/lib/constants";
import { average } from "@/lib/utils";
import type { InsightsResult, PatternRecord } from "@/lib/types";

export function recordToMarkdown(record: PatternRecord) {
  return [
    `## ${record.patternId} ${record.patternName}`,
    `- Screenshot: ${record.screenshotId}`,
    `- Product: ${record.product}`,
    `- Product Category: ${record.productCategory}`,
    `- Journey Stage: ${record.journeyStage}`,
    `- Screenshot State: ${record.screenshotState}`,
    `- Secondary Screenshot States: ${(Array.isArray(record.secondaryScreenshotStates) ? record.secondaryScreenshotStates : []).join(", ") || "—"}`,
    `- Screenshot State Reason: ${record.screenshotStateReason || "—"}`,
    `- Pattern Category: ${record.patternCategory}`,
    `- User Problem: ${record.userProblem}`,
    `- AI Capability: ${record.aiCapability}`,
    `- UI Anatomy: ${record.uiAnatomy}`,
    `- Interaction Rule: ${record.interactionRule}`,
    `- System Feedback: ${record.systemFeedback}`,
    `- Trust Mechanism: ${record.trustMechanism}`,
    `- Failure Handling: ${record.failureHandling}`,
    `- Reuse Level: ${record.reuseLevel}`,
    `- Design Judgment: ${record.designJudgment}`,
    `- Lens Score: ${JSON.stringify(record.lensScore ?? {})}`,
    `- Tags: ${(Array.isArray(record.tags) ? record.tags : []).join(", ")}`,
  ].join("\n");
}

export type BackupBundle = {
  version: 1;
  exportedAt: string;
  records: PatternRecord[];
  insights: InsightsResult | null;
};

export function recordsToJson(records: PatternRecord[]) {
  return JSON.stringify(records, null, 2);
}

/** Full backup for cross-device restore (records + latest insights). */
export function recordsToBackupJson(
  records: PatternRecord[],
  insights?: InsightsResult | null,
) {
  const bundle: BackupBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    insights: insights ?? null,
  };
  return JSON.stringify(bundle, null, 2);
}

export function recordsToCsv(records: PatternRecord[]) {
  const headers = [
    "patternId",
    "screenshotId",
    "product",
    "productCategory",
    "journeyStage",
    "screenshotState",
    "secondaryScreenshotStates",
    "screenshotStateReason",
    "patternName",
    "patternCategory",
    "reuseLevel",
    "designJudgment",
    "tags",
    "createdAt",
  ];

  const rows = records.map((record) =>
    [
      record.patternId,
      record.screenshotId,
      record.product,
      record.productCategory,
      record.journeyStage,
      record.screenshotState,
      (Array.isArray(record.secondaryScreenshotStates) ? record.secondaryScreenshotStates : []).join("; "),
      record.screenshotStateReason ?? "",
      record.patternName,
      record.patternCategory,
      record.reuseLevel,
      record.designJudgment,
      record.tags.join("; "),
      record.createdAt,
    ].map(escapeCsv),
  );

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

export function recordsToMarkdownReport(
  records: PatternRecord[],
  insights?: InsightsResult | null,
) {
  const products = Array.from(new Set(records.map((record) => record.product).filter(Boolean)));
  const highValue = records.filter((record) => record.reuseLevel === "High");

  return [
    "# AI Product Design Pattern Research Report",
    "",
    "## 1. Research Scope",
    `- Total Screenshots: ${records.length}`,
    `- Total Patterns: ${records.length}`,
    `- Product Coverage: ${products.join(", ") || "N/A"}`,
    `- Journey Coverage: ${JOURNEY_STAGES.filter((stage) => records.some((record) => record.journeyStage === stage)).join(", ") || "N/A"}`,
    "",
    "## 2. Product Coverage",
    ...PRODUCT_CATEGORIES.map(
      (category) =>
        `- ${category}: ${records.filter((record) => record.productCategory === category).length}`,
    ),
    "",
    "## 3. Journey Coverage",
    ...JOURNEY_STAGES.map(
      (stage) => `- ${stage}: ${records.filter((record) => record.journeyStage === stage).length}`,
    ),
    "",
    "## 4. Screenshot State Distribution",
    ...SCREENSHOT_STATES.map((state) => {
      const primary = records.filter((record) => record.screenshotState === state).length;
      const secondary = records.filter(
        (record) =>
          Array.isArray(record.secondaryScreenshotStates) &&
          record.secondaryScreenshotStates.includes(state),
      ).length;
      return `- ${state}: ${primary} primary, ${secondary} secondary`;
    }),
    `- Missing states: ${
      SCREENSHOT_STATES.filter(
        (state) =>
          state !== "Unknown" && !records.some((record) => record.screenshotState === state),
      ).join(", ") || "None"
    }`,
    "",
    "## 5. Pattern Summary",
    ...PATTERN_CATEGORIES.map(
      (category) =>
        `- ${category}: ${records.filter((record) => record.patternCategory === category).length}`,
    ),
    "",
    "## 6. High-value Patterns",
    ...(highValue.length
      ? highValue.map((record) => `- ${record.patternId} ${record.patternName}`)
      : ["- N/A"]),
    "",
    "## 7. Matrix Summary",
    ...JOURNEY_STAGES.map((stage) => {
      const stageRecords = records.filter((record) => record.journeyStage === stage);
      const avg = average(stageRecords.map((record) => record.lensScore?.reusability ?? 0));
      return `- ${stage}: ${stageRecords.length} patterns, avg reusability ${avg.toFixed(1)}`;
    }),
    "",
    "## 8. Key Insights",
    insights
      ? insights.researchScope
      : "No AI-generated insights yet. Use the Insights page to generate a research narrative.",
    insights ? insights.productCoverage : "",
    insights ? insights.journeyCoverage : "",
    insights ? insights.screenshotStateDistribution : "",
    insights ? insights.patternCategoryDistribution : "",
    insights ? insights.highValuePatterns : "",
    insights ? insights.crossProductComparison : "",
    insights ? insights.stageMaturity : "",
    insights ? insights.missingStates : "",
    insights ? insights.designOpportunities : "",
    "",
    "## 9. Design Recommendations",
    insights?.recommendations || "No AI recommendations generated yet.",
    "",
    "## 10. Pattern Records",
    records.map(recordToMarkdown).join("\n\n---\n\n") || "No records.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function escapeCsv(value: string) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
