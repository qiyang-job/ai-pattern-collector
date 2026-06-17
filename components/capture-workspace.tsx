"use client";

import type { PatternAnalysisResult } from "@/lib/types";
import { JOURNEY_STAGE_LABELS, PATTERN_CATEGORY_LABELS, PRODUCT_CATEGORY_LABELS, REUSE_LEVEL_LABELS, SCREENSHOT_STATE_LABELS, labelOf } from "@/lib/constants";
import { journeyCode } from "@/lib/utils";
import { Button, TypedIdBadge } from "@/components/ui";
import { RecordForm } from "@/components/record-form";

export type WorkspacePhase = "waiting" | "ready" | "extracting" | "failed" | "review";

type WorkspaceProps = {
  phase: WorkspacePhase;
  hasEvidence: boolean;
  hasRawNote: boolean;
  hasProduct: boolean;
  isAnalyzing: boolean;
  patternId?: string;
  screenshotId: string;
  analysis: PatternAnalysisResult;
  saveBlockers: string[];
  canSave: boolean;
  canExtract: boolean;
  onExtract: () => void;
  onRetry: () => void;
  onManualFill: () => void;
  onChange: (value: PatternAnalysisResult) => void;
  onSave: () => void;
  onReset: () => void;
};

const EXTRACT_INFERENCES = [
  "这张图属于哪类产品",
  "发生在用户旅程的哪个阶段",
  "展示了什么交互模式",
  "解决了用户什么不确定性",
  "暴露了 AI 的什么能力",
  "如何建立信任或控制感",
  "这个模式是否具有复用价值",
] as const;

const EXTRACTING_ITEMS = [
  { key: "screenshot", label: "截图证据", done: true },
  { key: "note", label: "研究备注", done: true },
  { key: "product", label: "产品上下文", done: false },
  { key: "ui", label: "界面结构", done: false },
  { key: "trust", label: "信任机制", done: false },
  { key: "reuse", label: "复用潜力", done: false },
] as const;

const SAVE_DESTINATIONS = ["记录", "矩阵", "旅程", "模式库", "洞察"] as const;

export function PatternExtractionWorkspace(props: WorkspaceProps) {
  const {
    phase,
    hasEvidence,
    hasRawNote,
    hasProduct,
    patternId,
    screenshotId,
    analysis,
    saveBlockers,
    canSave,
    canExtract,
    onExtract,
    onRetry,
    onManualFill,
    onChange,
    onSave,
    onReset,
  } = props;

  return (
    <div className="pattern-workspace pattern-workspace--flush">
      <div className="pattern-workspace-header">
        <h2 className="pattern-workspace-header-title">模式提炼工作台</h2>
      </div>

      <div className="pattern-workspace-body">
        {phase === "waiting" || phase === "ready" ? (
          <ExtractPanel
            ready={phase === "ready"}
            inferences={EXTRACT_INFERENCES}
            canExtract={canExtract}
            hasEvidence={hasEvidence}
            hasRawNote={hasRawNote}
            onExtract={onExtract}
          />
        ) : null}

        {phase === "extracting" ? (
          <ExtractingPanel hasProduct={hasProduct} />
        ) : null}

        {phase === "failed" ? (
          <FailedPanel onRetry={onRetry} onManualFill={onManualFill} />
        ) : null}

        {phase === "review" ? (
          <ReviewPanel
            patternId={patternId}
            screenshotId={screenshotId}
            analysis={analysis}
            saveBlockers={saveBlockers}
            canSave={canSave}
            onChange={onChange}
            onSave={onSave}
            onReset={onReset}
          />
        ) : null}
      </div>
    </div>
  );
}

function ExtractPanel({
  ready,
  inferences,
  canExtract,
  hasEvidence,
  hasRawNote,
  onExtract,
}: {
  ready: boolean;
  inferences: readonly string[];
  canExtract: boolean;
  hasEvidence: boolean;
  hasRawNote: boolean;
  onExtract: () => void;
}) {
  const hint = ready
    ? "证据已齐全，可以调用 AI 提炼"
    : !hasEvidence
      ? "先在左侧粘贴一张产品截图"
      : !hasRawNote
        ? "补充研究备注后即可开始提炼"
        : "在左侧补齐证据后即可提炼";

  return (
    <div className="workspace-panel">
      <h3 className="workspace-panel-title">{ready ? "可以开始提炼模式" : "准备提炼模式"}</h3>
      <p className="workspace-panel-subtitle">{hint}</p>

      <div className="mt-3">
        <div className="text-[10px] font-medium text-[var(--text-muted)]">AI 将推断：</div>
        <ol className="workspace-numbered-list">
          {inferences.map((item, i) => (
            <li key={item}>
              <span className="mono text-[10px] text-[var(--text-weak)]">{i + 1}.</span> {item}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 pt-3">
        <Button className="w-full sm:w-auto" onClick={onExtract} disabled={!canExtract}>
          用 AI 提炼模式
        </Button>
        {!ready ? (
          <p className="mt-2 text-[10px] text-[var(--text-weak)]">
            待证据齐全后可用，完成进度见顶部流程条
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ExtractingPanel({ hasProduct }: { hasProduct: boolean }) {
  const items = EXTRACTING_ITEMS.map((item) =>
    item.key === "product" ? { ...item, done: hasProduct } : item,
  );

  return (
    <div className="workspace-panel">
      <h3 className="workspace-panel-title">正在提炼模式…</h3>
      <p className="workspace-panel-subtitle">正在分析证据、备注、界面结构、信任机制与复用潜力</p>

      <div className="mt-3">
        <div className="text-[10px] font-medium text-[var(--text-muted)]">正在分析：</div>
        <ul className="extracting-checklist mt-2 space-y-1">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <span className={item.done ? "text-[var(--success)]" : "text-[var(--text-weak)]"}>
                {item.done ? "✓" : "•"}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FailedPanel({
  onRetry,
  onManualFill,
}: {
  onRetry: () => void;
  onManualFill: () => void;
}) {
  return (
    <div className="workspace-panel workspace-panel--danger">
      <h3 className="workspace-panel-title text-[var(--danger)]">提炼失败</h3>
      <p className="workspace-panel-subtitle">截图与研究备注已保留</p>
      <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">
        AI 未能从当前证据中提炼出有效模式。你可以重试提炼，或手动填写校对表单。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={onRetry}>重试提炼</Button>
        <Button variant="secondary" onClick={onManualFill}>
          手动填写
        </Button>
      </div>
    </div>
  );
}

function ReviewPanel({
  patternId,
  screenshotId,
  analysis,
  saveBlockers,
  canSave,
  onChange,
  onSave,
  onReset,
}: {
  patternId?: string;
  screenshotId: string;
  analysis: PatternAnalysisResult;
  saveBlockers: string[];
  canSave: boolean;
  onChange: (value: PatternAnalysisResult) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="workspace-review">
      <RecordPreview
        patternId={patternId}
        screenshotId={screenshotId}
        analysis={analysis}
        saveBlockers={saveBlockers}
      />

      <RecordForm
        variant="capture"
        value={analysis}
        patternId={patternId}
        onChange={onChange}
      />

      <div className="workspace-save-footer">
        <div className="text-[10px] leading-5 text-[var(--text-muted)]">
          保存后将同步至
          {SAVE_DESTINATIONS.map((d, i) => (
            <span key={d}>
              {i > 0 ? " · " : " "}
              <span className="text-[var(--text)]">{d}</span>
            </span>
          ))}
        </div>

        {saveBlockers.length > 0 ? (
          <div className="mt-2 text-[10px] text-[var(--warning)]">
            保存前还需：{saveBlockers.join("、")}
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-2 pt-3">
          <Button variant="text" onClick={onReset}>
            清空
          </Button>
          <Button variant={canSave ? "primary" : "secondary"} onClick={onSave} disabled={!canSave}>
            保存模式记录
          </Button>
        </div>
      </div>
    </div>
  );
}

function RecordPreview({
  patternId,
  screenshotId,
  analysis,
  saveBlockers,
}: {
  patternId?: string;
  screenshotId: string;
  analysis: PatternAnalysisResult;
  saveBlockers: string[];
}) {
  const nameMissing = !analysis.patternName.trim();

  return (
    <div className="record-preview">
      <div className="text-[10px] font-semibold tracking-wide text-[var(--text-weak)]">
        保存预览
      </div>
      <p className="mt-1 text-[10px] text-[var(--text-weak)]">将保存为：</p>

      {nameMissing ? (
        <p className="mt-2 text-[11px] font-medium text-[var(--warning)]">
          保存前需填写模式名称
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {patternId ? <TypedIdBadge kind="pattern">{patternId}</TypedIdBadge> : null}
          <span className="text-[12px] font-semibold">{analysis.patternName}</span>
        </div>
      )}

      <dl className="record-preview-meta mt-2 grid gap-1 text-[11px]">
        <PreviewRow label="证据" value={screenshotId} />
        <PreviewRow label="产品" value={analysis.product || "—"} />
        <PreviewRow label="类型" value={labelOf(analysis.productCategory, PRODUCT_CATEGORY_LABELS) || "—"} />
        <PreviewRow label="阶段" value={`${journeyCode(analysis.journeyStage)} ${labelOf(analysis.journeyStage, JOURNEY_STAGE_LABELS)}`} />
        <PreviewRow label="分类" value={labelOf(analysis.patternCategory, PATTERN_CATEGORY_LABELS) || "—"} />
        <PreviewRow label="复用" value={labelOf(analysis.reuseLevel, REUSE_LEVEL_LABELS) || "—"} />
      </dl>

      {saveBlockers.length > 0 && !nameMissing ? (
        <p className="mt-2 text-[10px] text-[var(--text-weak)]">
          还需完善：{saveBlockers.join("、")}
        </p>
      ) : null}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-10 shrink-0 text-[var(--text-weak)]">{label}</dt>
      <dd className="min-w-0 truncate text-[var(--text-muted)]">{value}</dd>
    </div>
  );
}

export function getWorkspacePhase(params: {
  isAnalyzing: boolean;
  analysisStatus: "idle" | "analyzing" | "analyzed" | "failed";
  showReview: boolean;
  analyzeReady: boolean;
}): WorkspacePhase {
  if (params.isAnalyzing) return "extracting";
  if (params.showReview || params.analysisStatus === "analyzed") return "review";
  if (params.analysisStatus === "failed") return "failed";
  if (params.analyzeReady) return "ready";
  return "waiting";
}

export function getSaveBlockers(params: {
  hasEvidence: boolean;
  hasRawNote: boolean;
  analysis: PatternAnalysisResult;
}): string[] {
  const missing: string[] = [];
  if (!params.hasEvidence) missing.push("截图证据");
  if (!params.hasRawNote) missing.push("研究备注");
  if (!params.analysis.patternName.trim()) missing.push("模式名称");
  if (!params.analysis.productCategory) missing.push("产品类型");
  if (!params.analysis.journeyStage) missing.push("旅程阶段");
  if (!params.analysis.patternCategory) missing.push("模式分类");
  return missing;
}
