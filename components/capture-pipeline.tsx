"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TypedIdBadge } from "@/components/ui";
import { WorkflowStatusPill } from "@/components/research-ui";

export type EvidenceStepStatus = "缺失截图" | "缺失备注" | "证据就绪";
export type ExtractStepStatus = "尚未提炼" | "可提炼" | "提炼中" | "已完成" | "提炼失败";
export type ReviewStepStatus = "已锁定" | "需校对" | "可保存";
export type SavedStepStatus = "未保存" | "已保存";

const STEP_LABELS = ["采集证据", "提炼模式", "校对保存", "已入库"] as const;

export function CapturePipeline({
  screenshotId,
  patternId,
  evidenceStatus,
  extractStatus,
  reviewStatus,
  savedStatus,
  activeStep,
}: {
  screenshotId: string;
  patternId?: string;
  evidenceStatus: EvidenceStepStatus;
  extractStatus: ExtractStepStatus;
  reviewStatus: ReviewStepStatus;
  savedStatus: SavedStepStatus;
  activeStep: 1 | 2 | 3 | 4;
}) {
  return (
    <header className="capture-pipeline-header">
      <div className="capture-pipeline-top page-gutter-x">
        <div className="capture-pipeline-steps">
          <PipelineStep
            num={1}
            label={STEP_LABELS[0]}
            active={activeStep === 1}
            done={evidenceStatus === "证据就绪"}
          >
            {screenshotId !== "S---" ? (
              <TypedIdBadge kind="evidence">{screenshotId}</TypedIdBadge>
            ) : null}
            <WorkflowStatusPill
              status={evidenceStatus}
              tone={evidenceStatus === "证据就绪" ? "success" : "warning"}
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
                    : extractStatus === "提炼失败"
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
            {patternId && reviewStatus !== "已锁定" ? (
              <TypedIdBadge kind="pattern">{patternId}</TypedIdBadge>
            ) : null}
            <WorkflowStatusPill
              status={reviewStatus}
              tone={
                reviewStatus === "可保存"
                  ? "success"
                  : reviewStatus === "需校对"
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
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
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
