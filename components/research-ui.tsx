"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TypedIdBadge } from "@/components/ui";
import { MAX_SCREENSHOTS } from "@/lib/capture-draft-store";

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

/**
 * 多截图证据槽 — 支持最多 5 张截图的采集、预览和删除
 */
export function MultiImageEvidenceSlot({
  primaryUrl,
  extraUrls,
  onAddClick,
  onRemoveImage,
  onPreview,
  onDragOver,
  onDrop,
}: {
  /** 主图 data URL */
  primaryUrl: string;
  /** 额外截图 data URL 数组 */
  extraUrls: string[];
  onAddClick: () => void;
  onRemoveImage?: (index: number) => void;
  onPreview: (url: string, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const allImages = primaryUrl ? [primaryUrl, ...extraUrls] : [...extraUrls];
  const total = allImages.length;

  return (
    <div className="evidence-slot">
      {/* 头部：计数 */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="text-[10px] font-medium text-[var(--text-muted)]">截图证据</span>
        <span className="mono text-[10px] text-[var(--text-weak)]">
          {total}/{MAX_SCREENSHOTS}
        </span>
      </div>

      {/* 图片区域：主图/空槽位 + 缩略图条 */}
      <div
        className="evidence-slot-preview relative bg-[var(--panel)] min-h-[140px]"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {total > 0 ? (
          <div className="flex flex-col h-full">
            {/* 主图预览区（可点击放大） */}
            <button
              type="button"
              className="relative flex h-[120px] w-full items-center justify-center hover:bg-[var(--panel-muted)] border-b border-[var(--border)]"
              onClick={() => primaryUrl && onPreview(primaryUrl, 0)}
              title="点击放大预览"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={primaryUrl || extraUrls[0]} alt="截图证据" className="max-h-full max-w-full object-contain" />
              {total === 1 && onRemoveImage ? (
                <span
                  className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)] text-[11px] text-white cursor-pointer hover:bg-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(0);
                  }}
                  role="button"
                  aria-label="删除此截图"
                >
                  ×
                </span>
              ) : null}
            </button>

            {/* 缩略图条 */}
            {total > 1 && (
              <div className="flex items-center gap-1 p-1.5 overflow-x-auto">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    className={cn(
                      "relative shrink-0 rounded-[var(--radius-sm)] overflow-hidden border",
                      i === 0 ? "w-14 h-14 border-[var(--accent)]" : "w-11 h-11 border-[var(--border)] hover:border-[var(--accent-muted)]",
                    )}
                    onClick={() => onPreview(url, i)}
                    title={`截图 ${i + 1}（点击删除）`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`截图 ${i + 1}`} className="h-full w-full object-cover" />
                    {onRemoveImage ? (
                      <span
                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] text-[9px] text-white cursor-pointer hover:bg-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImage(i);
                        }}
                        role="button"
                        aria-label="删除此截图"
                      >
                        ×
                      </span>
                    ) : null}
                  </button>
                ))}
                {/* 添加更多按钮 */}
                {total < MAX_SCREENSHOTS && (
                  <button
                    type="button"
                    className="shrink-0 flex w-11 h-11 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] text-[var(--text-weak)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                    onClick={onAddClick}
                    title={`添加截图 (${total}/${MAX_SCREENSHOTS})`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
              </div>
            )}
            {total === 1 && total < MAX_SCREENSHOTS && (
              <div className="flex items-center justify-center p-1.5">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[10px] text-[var(--text-weak)] hover:text-[var(--accent)] border border-dashed border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                  onClick={onAddClick}
                  title={`添加更多截图 (${total}/${MAX_SCREENSHOTS})`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  添加截图 ({total}/{MAX_SCREENSHOTS})
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 空状态：粘贴/上传入口 */
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] text-[var(--text-weak)] hover:bg-[var(--panel-muted)]"
            onClick={onAddClick}
          >
            <span className="mono text-[12px] font-medium text-[var(--text-muted)]">Cmd + V</span>
            <span className="text-[var(--text-muted)]">粘贴截图</span>
            <span className="mt-0.5 text-[10px]">支持最多 {MAX_SCREENSHOTS} 张</span>
          </button>
        )}
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
  letter: "A" | "B" | "C" | "D" | "E" | "Ev";
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="form-module">
      <div className="form-module-header">
        <TypedIdBadge kind="pattern" className="shrink-0 self-center">
          {letter}
        </TypedIdBadge>
        <div className="min-w-0 flex flex-col justify-center gap-0.5">
          <span className="block text-[11px] font-semibold leading-4 tracking-wide text-[var(--text-muted)]">
            {title}
          </span>
          {description ? (
            <p className="text-[10px] font-normal leading-4 text-[var(--text-weak)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2 py-2.5 px-0">{children}</div>
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
