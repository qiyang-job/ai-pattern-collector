"use client";

import type { PatternAnalysisResult } from "@/lib/types";
import {
  JOURNEY_STAGE_LABELS,
  PATTERN_CATEGORY_LABELS,
  PRODUCT_CATEGORY_LABELS,
  REUSE_LEVEL_LABELS,
  SCREENSHOT_STATE_LABELS,
  labelOf,
} from "@/lib/constants";
import { journeyCode } from "@/lib/utils";
import { TypedIdBadge } from "@/components/ui";

export function RecordPreview({
  patternId,
  screenshotId,
  analysis,
  previewLabel = "保存预览 · Record Preview",
}: {
  patternId?: string;
  screenshotId?: string;
  analysis: PatternAnalysisResult;
  previewLabel?: string;
}) {
  const nameMissing = !analysis.patternName.trim();
  const evidenceLabel = screenshotId ?? "保存后分配";

  return (
    <div className="record-preview">
      <div className="text-[10px] font-semibold tracking-wide text-[var(--text-weak)]">
        {previewLabel}
      </div>

      {nameMissing ? (
        <p className="mt-2 text-[11px] font-medium text-[var(--warning)]">
          保存前需填写模式名称
        </p>
      ) : (
        <div className="record-preview-title mt-2">
          {patternId ? <TypedIdBadge kind="pattern">{patternId}</TypedIdBadge> : null}
          <span className="min-w-0 text-[12px] font-semibold">{analysis.patternName}</span>
        </div>
      )}

      <dl className="record-preview-meta mt-2 text-[11px]">
        <PreviewRow label="证据" value={evidenceLabel} />
        <PreviewRow label="产品" value={analysis.product || "—"} />
        <PreviewRow label="类型" value={labelOf(analysis.productCategory, PRODUCT_CATEGORY_LABELS) || "—"} />
        <PreviewRow label="阶段" value={`${journeyCode(analysis.journeyStage)} ${labelOf(analysis.journeyStage, JOURNEY_STAGE_LABELS)}`} />
        <PreviewRow label="状态" value={screenshotStateText(analysis)} />
        <PreviewRow label="分类" value={labelOf(analysis.patternCategory, PATTERN_CATEGORY_LABELS) || "—"} />
        <PreviewRow label="复用" value={labelOf(analysis.reuseLevel, REUSE_LEVEL_LABELS) || "—"} />
      </dl>
    </div>
  );
}

function screenshotStateText(analysis: PatternAnalysisResult): string {
  const primary = labelOf(analysis.screenshotState, SCREENSHOT_STATE_LABELS) || "—";
  const secondary = Array.isArray(analysis.secondaryScreenshotStates)
    ? analysis.secondaryScreenshotStates
    : [];
  if (secondary.length === 0) return primary;
  return `${primary} + ${secondary.map((s) => labelOf(s, SCREENSHOT_STATE_LABELS)).join("、")}`;
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-10 shrink-0 text-[var(--text-weak)]">{label}</dt>
      <dd className="min-w-0 truncate text-[var(--text-muted)]">{value}</dd>
    </div>
  );
}
