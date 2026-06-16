"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TypedIdBadge } from "@/components/ui";
import { WorkflowStatusPill } from "@/components/research-ui";

export type EvidenceStepStatus = "缺失截图" | "缺失备注" | "已就绪";
export type ExtractStepStatus = "未开始" | "可提炼" | "提炼中" | "已完成" | "失败";
export type ReviewStepStatus = "未解锁" | "待校对" | "可保存";
export type SavedStepStatus = "未保存" | "已保存";

export type CaptureTaskMessage =
  | "paste-screenshot"
  | "add-note"
  | "extract"
  | "review"
  | "saved";

const TASK_MESSAGES: Record<CaptureTaskMessage, string> = {
  "paste-screenshot": "粘贴一张 AI 产品截图，创建证据记录。",
  "add-note": "补充研究备注，说明这张图为什么值得研究。",
  extract: "从当前证据中提炼可复用的设计模式。",
  review: "校对 AI 提炼的模式字段，确认后保存。",
  saved: "记录已保存到模式数据库。",
};

const STEP_LABELS = ["采集证据", "提炼模式", "校对保存", "已入库"] as const;

export function CapturePipeline({
  screenshotId,
  patternId,
  evidenceStatus,
  extractStatus,
  reviewStatus,
  savedStatus,
  currentTask,
  activeStep,
}: {
  screenshotId: string;
  patternId?: string;
  evidenceStatus: EvidenceStepStatus;
  extractStatus: ExtractStepStatus;
  reviewStatus: ReviewStepStatus;
  savedStatus: SavedStepStatus;
  currentTask: CaptureTaskMessage;
  activeStep: 1 | 2 | 3 | 4;
}) {
  return (
    <header className="capture-pipeline-header border-b border-[var(--border)] bg-[var(--panel-muted)]">
      <div className="px-4 pt-2.5">
        <div className="text-[10px] font-semibold tracking-wider text-[var(--text-weak)]">
          采集流程
        </div>
        <div className="capture-pipeline-steps mt-2">
          <PipelineStep
            num={1}
            label={STEP_LABELS[0]}
            active={activeStep === 1}
            done={evidenceStatus === "已就绪"}
          >
            {screenshotId !== "S---" ? (
              <TypedIdBadge kind="evidence">{screenshotId}</TypedIdBadge>
            ) : null}
            <WorkflowStatusPill
              status={evidenceStatus}
              tone={evidenceStatus === "已就绪" ? "success" : "warning"}
            />
          </PipelineStep>

          <span className="workflow-arrow">→</span>

          <PipelineStep
            num={2}
            label={STEP_LABELS[1]}
            active={activeStep === 2}
            done={extractStatus === "已完成"}
          >
            <WorkflowStatusPill
              status={extractStatus}
              tone={
                extractStatus === "已完成"
                  ? "success"
                  : extractStatus === "提炼中"
                    ? "active"
                    : extractStatus === "失败"
                      ? "danger"
                      : extractStatus === "可提炼"
                        ? "ready"
                        : "neutral"
              }
            />
          </PipelineStep>

          <span className="workflow-arrow">→</span>

          <PipelineStep
            num={3}
            label={STEP_LABELS[2]}
            active={activeStep === 3}
            done={reviewStatus === "可保存"}
          >
            {patternId && reviewStatus !== "未解锁" ? (
              <TypedIdBadge kind="pattern">{patternId}</TypedIdBadge>
            ) : null}
            <WorkflowStatusPill
              status={reviewStatus}
              tone={
                reviewStatus === "可保存"
                  ? "success"
                  : reviewStatus === "待校对"
                    ? "ready"
                    : "neutral"
              }
            />
          </PipelineStep>

          <span className="workflow-arrow">→</span>

          <PipelineStep
            num={4}
            label={STEP_LABELS[3]}
            active={activeStep === 4}
            done={savedStatus === "已保存"}
          >
            <WorkflowStatusPill
              status={savedStatus}
              tone={savedStatus === "已保存" ? "success" : "neutral"}
            />
          </PipelineStep>
        </div>
      </div>
      <div className="capture-current-task border-t border-[var(--border)] px-4 py-2">
        <span className="text-[10px] font-medium text-[var(--text-weak)]">当前任务 · </span>
        <span className="text-[11px] text-[var(--text-muted)]">{TASK_MESSAGES[currentTask]}</span>
      </div>
    </header>
  );
}

function PipelineStep({
  num,
  label,
  active,
  done,
  children,
}: {
  num: number;
  label: string;
  active?: boolean;
  done?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "capture-pipeline-step",
        active && "capture-pipeline-step--active",
        done && "capture-pipeline-step--done",
      )}
    >
      <span className="capture-pipeline-step-num">步骤 {num}</span>
      <span className="capture-pipeline-step-label">{label}</span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

export function getCurrentTask(params: {
  savedFlash: boolean;
  inReview: boolean;
  analyzeReady: boolean;
  hasEvidence: boolean;
  hasRawNote: boolean;
}): CaptureTaskMessage {
  if (params.savedFlash) return "saved";
  if (params.inReview) return "review";
  if (params.analyzeReady) return "extract";
  if (params.hasEvidence && !params.hasRawNote) return "add-note";
  return "paste-screenshot";
}

export function getActiveStep(params: {
  savedFlash: boolean;
  inReview: boolean;
  isAnalyzing: boolean;
  analyzeReady: boolean;
  evidenceReady: boolean;
}): 1 | 2 | 3 | 4 {
  if (params.savedFlash) return 4;
  if (params.inReview) return 3;
  if (params.isAnalyzing || (params.analyzeReady && params.evidenceReady)) return 2;
  return 1;
}
