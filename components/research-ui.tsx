"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TypedIdBadge } from "@/components/ui";

export type AnalysisUiStatus = "idle" | "analyzing" | "analyzed" | "failed";
export type EvidenceUiStatus = "empty" | "ready" | "analyzing" | "analyzed";

export type PipelineEvidenceStatus = "Empty" | "Ready";
export type PipelineAnalysisStatus =
  | "Not analyzed"
  | "Ready to analyze"
  | "Analyzing"
  | "Analyzed"
  | "Failed";
export type PipelinePatternStatus = "Review required" | "Ready to save";

export function CaptureWorkflowPipeline({
  screenshotId,
  patternId,
  evidenceStatus,
  analysisStatus,
  patternStatus,
}: {
  screenshotId: string;
  patternId: string;
  evidenceStatus: PipelineEvidenceStatus;
  analysisStatus: PipelineAnalysisStatus;
  patternStatus: PipelinePatternStatus;
}) {
  return (
    <div className="capture-pipeline border-b border-[var(--border)] bg-[var(--panel-muted)] px-4 py-2.5">
      <PipelineSegment label="Evidence">
        <TypedIdBadge kind="evidence">{screenshotId}</TypedIdBadge>
        <WorkflowStatusPill status={evidenceStatus} tone={evidenceStatus === "Ready" ? "ready" : "neutral"} />
      </PipelineSegment>

      <span className="workflow-arrow">→</span>

      <PipelineSegment label="Analysis">
        <WorkflowStatusPill
          status={analysisStatus}
          tone={
            analysisStatus === "Analyzed"
              ? "success"
              : analysisStatus === "Analyzing"
                ? "active"
                : analysisStatus === "Failed"
                  ? "danger"
                  : analysisStatus === "Ready to analyze"
                    ? "ready"
                    : "neutral"
          }
        />
      </PipelineSegment>

      <span className="workflow-arrow">→</span>

      <PipelineSegment label="Pattern">
        <TypedIdBadge kind="pattern">{patternId}</TypedIdBadge>
        <WorkflowStatusPill
          status={patternStatus}
          tone={patternStatus === "Ready to save" ? "success" : "warning"}
        />
      </PipelineSegment>
    </div>
  );
}

function PipelineSegment({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="capture-pipeline-segment">
      <span className="capture-pipeline-label">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

export function WorkflowStatusPill({
  status,
  tone = "neutral",
}: {
  status: string;
  tone?: "neutral" | "ready" | "active" | "success" | "warning" | "danger";
}) {
  return (
    <span
      className={cn(
        "workflow-status-pill",
        tone === "ready" && "workflow-status-pill--ready",
        tone === "active" && "workflow-status-pill--active",
        tone === "success" && "workflow-status-pill--success",
        tone === "warning" && "workflow-status-pill--warning",
        tone === "danger" && "workflow-status-pill--danger",
      )}
    >
      {status}
    </span>
  );
}

/** @deprecated Use CaptureWorkflowPipeline on Capture page */
export function WorkflowPipeline({
  screenshotId,
  patternId,
  reviewStatus,
}: {
  screenshotId: string;
  patternId: string;
  reviewStatus: string;
}) {
  return (
    <CaptureWorkflowPipeline
      screenshotId={screenshotId}
      patternId={patternId}
      evidenceStatus="Empty"
      analysisStatus="Not analyzed"
      patternStatus={reviewStatus.includes("保存") ? "Ready to save" : "Review required"}
    />
  );
}

export function WorkflowStep({
  step,
  title,
  subtitle,
  active,
  done,
  className,
  bodyClassName,
  children,
}: {
  step: 1 | 2 | 3;
  title: string;
  subtitle: string;
  active?: boolean;
  done?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col rounded-[var(--radius-md)] bg-[var(--panel)]",
        active && "ring-1 ring-[var(--accent-muted)]",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 bg-[var(--panel-muted)] px-3 py-2">
        <span
          className={cn(
            "mono flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] text-[10px] font-semibold",
            done
              ? "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-[var(--success)]"
              : active
                ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                : "bg-[var(--panel-muted)] text-[var(--text-weak)]",
          )}
        >
          {step}
        </span>
        <div>
          <div className="text-[12px] font-semibold text-[var(--text)]">{title}</div>
          <div className="text-[10px] text-[var(--text-weak)]">{subtitle}</div>
        </div>
      </div>
      <div className={cn("min-h-0 flex-1 overflow-y-auto p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EvidenceSlot({
  screenshotId,
  status,
  imageDataUrl,
  meta,
  onUploadClick,
  onDragOver,
  onDrop,
  onPreviewClick,
}: {
  screenshotId: string;
  status: EvidenceUiStatus;
  imageDataUrl: string;
  meta: string;
  onUploadClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onPreviewClick?: () => void;
}) {
  const statusLabel =
    status === "empty"
      ? "缺失截图"
      : status === "ready"
        ? "证据就绪"
        : status === "analyzing"
          ? "提炼中"
          : "已分析";

  return (
    <div className="evidence-slot">
      <div className="flex items-center justify-between px-2 py-1.5">
        <TypedIdBadge kind="evidence">{screenshotId}</TypedIdBadge>
        <WorkflowStatusPill
          status={statusLabel}
          tone={
            status === "analyzed"
              ? "success"
              : status === "analyzing"
                ? "active"
                : statusLabel === "证据就绪"
                  ? "ready"
                  : "neutral"
          }
        />
      </div>
      <div
        className="evidence-slot-preview relative bg-[var(--panel)]"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {imageDataUrl ? (
          <button
            type="button"
            className="flex h-full w-full items-center justify-center hover:bg-[var(--panel-muted)]"
            onClick={onPreviewClick}
            title="点击放大预览"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt="截图证据" className="max-h-full w-full object-contain" />
          </button>
        ) : (
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] text-[var(--text-weak)] hover:bg-[var(--panel-muted)]"
            onClick={onUploadClick}
          >
            <span className="mono text-[12px] font-medium text-[var(--text-muted)]">Cmd + V</span>
            <span className="text-[var(--text-muted)]">粘贴截图</span>
            <span className="mt-0.5 text-[10px]">或上传图片</span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between bg-[var(--panel-muted)] px-2 py-1 mono text-[10px] text-[var(--text-weak)]">
        <span className="truncate">{meta}</span>
        <button type="button" className="shrink-0 text-[var(--accent)] hover:underline" onClick={onUploadClick}>
          上传
        </button>
      </div>
    </div>
  );
}

export function AnalysisStatusBadge({
  status,
  label,
}: {
  status: AnalysisUiStatus;
  label?: string;
}) {
  const map = {
    idle: { text: label ?? "未分析", color: "var(--text-weak)" },
    analyzing: { text: label ?? "分析中", color: "var(--accent)" },
    analyzed: { text: label ?? "已分析", color: "var(--success)" },
    failed: { text: label ?? "失败", color: "var(--danger)" },
  };
  const { text, color } = map[status];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wide text-[var(--text-muted)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {text}
    </span>
  );
}

export function StructurePreviewList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="structure-preview">
      <div className="structure-preview-title">{title}</div>
      <ul className="structure-preview-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function HintChip({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="hint-chip" onClick={onClick}>
      {children}
    </button>
  );
}

export function FormModule({
  letter,
  title,
  description,
  children,
}: {
  letter: "A" | "B" | "C" | "D" | "E";
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="form-module">
      <div className="form-module-header">
        <span className="mono flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-muted)] text-[10px] font-bold text-[var(--accent)]">
          {letter}
        </span>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold tracking-wide text-[var(--text-muted)]">
            {title}
          </span>
          {description ? (
            <p className="mt-0.5 text-[10px] font-normal leading-4 text-[var(--text-weak)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2 p-2.5">{children}</div>
    </div>
  );
}

export function SlotEmpty({ children }: { children: ReactNode }) {
  return <div className="slot-empty">{children}</div>;
}

export function ReportSkeletonSection({
  num,
  title,
  content,
  placeholder = "等待采集记录",
}: {
  num: string;
  title: string;
  content?: string;
  placeholder?: string;
}) {
  return (
    <div className="report-skeleton-section">
      <div className="flex items-center gap-2">
        <TypedIdBadge kind="lens">{num}</TypedIdBadge>
        <h3 className="text-[12px] font-semibold text-[var(--text)]">{title}</h3>
      </div>
      <p className="mt-1.5 text-[12px] leading-5 text-[var(--text-muted)]">
        {content ?? placeholder}
      </p>
    </div>
  );
}

export function DistributionRow({
  label,
  count,
  max,
  accent,
  core,
  onClick,
  active,
}: {
  label: ReactNode;
  count: number;
  max: number;
  accent?: boolean;
  core?: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const body = (
    <>
      <span className="dist-row-label">
        <span className="dist-row-label-text">{label}</span>
        {core ? (
          <span className="mono text-[8px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            核心
          </span>
        ) : null}
      </span>
      <span className="dist-row-track" aria-hidden>
        <span
          className={cn(
            "dist-row-fill",
            count === 0 && "dist-row-fill--empty",
            accent && count > 0 && "dist-row-fill--accent",
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className={cn("dist-row-value", count === 0 && "dist-row-value--zero")}>{count}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cn("dist-row dist-row--clickable", core && "dist-row--core", active && "dist-row--active")}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  return <div className={cn("dist-row", core && "dist-row--core")}>{body}</div>;
}

export function CoverageBar({ percent }: { percent: number }) {
  return (
    <div className="coverage-bar mt-2">
      <div className="coverage-bar-fill" style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  );
}

export function CoreBandLabel() {
  return (
    <span className="text-[9px] font-semibold tracking-wider text-[var(--accent)]">
      AI 核心交互阶段带
    </span>
  );
}

export function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="image-lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="截图预览"
    >
      <div className="image-lightbox-panel" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-[85vh] max-w-[90vw] object-contain" />
        <button type="button" className="image-lightbox-close" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
