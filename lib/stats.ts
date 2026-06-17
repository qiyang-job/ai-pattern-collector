import {
  JOURNEY_STAGES,
  PATTERN_CATEGORIES,
  PRODUCT_CATEGORIES,
  SCREENSHOT_STATES,
} from "@/lib/constants";
import { average } from "@/lib/utils";
import { normalizeLensScore } from "@/lib/normalize";
import type { JourneyStage, PatternRecord, ProductCategory } from "@/lib/types";

function lensValues(record: PatternRecord): number[] {
  return Object.values(normalizeLensScore(record?.lensScore));
}

export function computeRecordStats(records: PatternRecord[]) {
  const products = Array.from(new Set(records.map((record) => record.product).filter(Boolean)));
  const productCategories = Array.from(
    new Set(records.map((record) => record.productCategory)),
  );
  const averageLensScore = average(
    records.flatMap((record) => lensValues(record)),
  );

  return {
    totalScreenshots: records.length,
    totalPatterns: records.length,
    coveredProducts: products.length,
    products,
    coveredProductCategories: productCategories.length,
    productCategories,
    highReusePatterns: records.filter((record) => record.reuseLevel === "High"),
    averageLensScore,
    journeyCounts: JOURNEY_STAGES.map((stage) => ({
      stage,
      count: records.filter((record) => record.journeyStage === stage).length,
    })),
    productCategoryCounts: PRODUCT_CATEGORIES.map((category) => ({
      category,
      count: records.filter((record) => record.productCategory === category).length,
    })),
    patternCategoryCounts: PATTERN_CATEGORIES.map((category) => ({
      category,
      count: records.filter((record) => record.patternCategory === category).length,
    })),
    // 截图状态分布：主状态计数（次要状态另计），用于 Insights 的界面状态密度与缺失分析
    screenshotStateCounts: SCREENSHOT_STATES.map((state) => ({
      state,
      count: records.filter((record) => record.screenshotState === state).length,
      secondaryCount: records.filter((record) =>
        Array.isArray(record.secondaryScreenshotStates) &&
        record.secondaryScreenshotStates.includes(state),
      ).length,
    })),
    // 尚未被任何记录（主状态）覆盖的界面状态，提示补采方向（排除 Unknown）
    missingStates: SCREENSHOT_STATES.filter(
      (state) =>
        state !== "Unknown" &&
        !records.some((record) => record.screenshotState === state),
    ),
    heatmap: JOURNEY_STAGES.flatMap((stage) =>
      PRODUCT_CATEGORIES.map((category) => {
        const cellRecords = getMatrixCellRecords(records, category, stage);
        return {
          stage,
          category,
          count: cellRecords.length,
          averageReusability: average(
            cellRecords.map((record) => normalizeLensScore(record?.lensScore).reusability),
          ),
        };
      }),
    ),
  };
}

export function getMatrixCellRecords(
  records: PatternRecord[],
  category: ProductCategory,
  stage: JourneyStage,
) {
  return records.filter(
    (record) => record.productCategory === category && record.journeyStage === stage,
  );
}

export function averageLensForRecords(records: PatternRecord[]) {
  return average(records.flatMap((record) => lensValues(record)));
}

export function computeMatrixCoverage(records: PatternRecord[]) {
  const total = JOURNEY_STAGES.length * PRODUCT_CATEGORIES.length;
  let filled = 0;
  for (const stage of JOURNEY_STAGES) {
    for (const category of PRODUCT_CATEGORIES) {
      if (getMatrixCellRecords(records, category, stage).length > 0) filled += 1;
    }
  }
  return { filled, total, percent: total > 0 ? Math.round((filled / total) * 100) : 0 };
}
