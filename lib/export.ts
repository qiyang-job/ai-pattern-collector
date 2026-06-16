import { JOURNEY_STAGES, PATTERN_CATEGORIES, PRODUCT_CATEGORIES } from "@/lib/constants";
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
    `- Lens Score: ${JSON.stringify(record.lensScore)}`,
    `- Tags: ${record.tags.join(", ")}`,
  ].join("\n");
}

export function recordsToJson(records: PatternRecord[]) {
  return JSON.stringify(records, null, 2);
}

export function recordsToCsv(records: PatternRecord[]) {
  const headers = [
    "patternId",
    "screenshotId",
    "product",
    "productCategory",
    "journeyStage",
    "screenshotState",
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
    "## 4. Pattern Summary",
    ...PATTERN_CATEGORIES.map(
      (category) =>
        `- ${category}: ${records.filter((record) => record.patternCategory === category).length}`,
    ),
    "",
    "## 5. High-value Patterns",
    ...(highValue.length
      ? highValue.map((record) => `- ${record.patternId} ${record.patternName}`)
      : ["- N/A"]),
    "",
    "## 6. Matrix Summary",
    ...JOURNEY_STAGES.map((stage) => {
      const stageRecords = records.filter((record) => record.journeyStage === stage);
      const avg = average(stageRecords.map((record) => record.lensScore.reusability));
      return `- ${stage}: ${stageRecords.length} patterns, avg reusability ${avg.toFixed(1)}`;
    }),
    "",
    "## 7. Key Insights",
    insights
      ? insights.researchScope
      : "No AI-generated insights yet. Use the Insights page to generate a research narrative.",
    insights ? insights.productCoverage : "",
    insights ? insights.journeyCoverage : "",
    insights ? insights.highValuePatterns : "",
    insights ? insights.crossProductComparison : "",
    insights ? insights.stageMaturity : "",
    insights ? insights.designOpportunities : "",
    "",
    "## 8. Design Recommendations",
    insights?.recommendations || "No AI recommendations generated yet.",
    "",
    "## 9. Pattern Records",
    records.map(recordToMarkdown).join("\n\n---\n\n") || "No records.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function escapeCsv(value: string) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
