"use client";

import type { PatternAnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { ExtractingPanel } from "@/components/extracting-panel";
import { RecordForm } from "@/components/record-form";
import { RecordPreview } from "@/components/record-preview";

export type WorkspacePhase = "waiting" | "ready" | "extracting" | "failed" | "review";

type WorkspaceProps = {
  phase: WorkspacePhase;
  hasProduct: boolean;
  isAnalyzing: boolean;
  patternId?: string;
  screenshotId?: string;
  analysis: PatternAnalysisResult;
  saveBlockers: string[];
  canSave: boolean;
  onRetry: () => void;
  onManualFill: () => void;
  onChange: (value: PatternAnalysisResult) => void;
  onSave: () => void;
};

const SAVE_DESTINATIONS = ["记录", "矩阵", "旅程", "模式库", "洞察"] as const;

export function PatternExtractionWorkspace(props: WorkspaceProps) {
  const {
    phase,
    hasProduct,
    patternId,
    screenshotId,
    analysis,
    saveBlockers,
    canSave,
    onRetry,
    onManualFill,
    onChange,
    onSave,
  } = props;

  return (
    <div className={cn("pattern-workspace pattern-workspace--flush")}>
      <div className={cn("pattern-workspace-body", phase === "extracting" && "pattern-workspace-body--extracting")}>
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
            onRetry={onRetry}
            onSave={onSave}
          />
        ) : null}
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
  onRetry,
  onSave,
}: {
  patternId?: string;
  screenshotId?: string;
  analysis: PatternAnalysisResult;
  saveBlockers: string[];
  canSave: boolean;
  onChange: (value: PatternAnalysisResult) => void;
  onRetry: () => void;
  onSave: () => void;
}) {
  return (
    <>
      <div className="workspace-review">
        <RecordPreview
          patternId={patternId}
          screenshotId={screenshotId}
          analysis={analysis}
        />

        <RecordForm
          variant="capture"
          value={analysis}
          patternId={patternId}
          onChange={onChange}
        />
      </div>

      <div className="workspace-save-footer">
        <div className="workspace-save-actions">
          <Button variant={canSave ? "primary" : "secondary"} onClick={onSave} disabled={!canSave}>
            保存模式记录
          </Button>
          <Button variant="secondary" onClick={onRetry}>
            重新提取
          </Button>
        </div>

        <div className="workspace-save-meta">
          <p className="workspace-save-destinations text-[10px] leading-5 text-[var(--text-muted)]">
            保存后将同步至
            {SAVE_DESTINATIONS.map((d, i) => (
              <span key={d}>
                {i > 0 ? " · " : " "}
                <span className="text-[var(--text)]">{d}</span>
              </span>
            ))}
          </p>

          {saveBlockers.length > 0 ? (
            <p className="mt-1 text-[10px] text-[var(--warning)]">
              保存前还需：{saveBlockers.join("、")}
            </p>
          ) : null}
        </div>
      </div>
    </>
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
