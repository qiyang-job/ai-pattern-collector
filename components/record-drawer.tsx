"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, RefreshCw } from "lucide-react";
import { RecordForm } from "@/components/record-form";
import {
  Button,
  Field,
  PanelHeader,
  TypedIdBadge,
  SectionLabel,
  inputClass,
  textareaClass,
} from "@/components/ui";
import { recordToMarkdown, recordsToJson } from "@/lib/export";
import { useRecordsStore } from "@/lib/records-store";
import type { PatternAnalysisResult, PatternRecord } from "@/lib/types";
import { downloadTextFile, formatDate } from "@/lib/utils";
import { callCloudFunction, ensureAuth } from "@/lib/cloudbase";

export function RecordDrawer({
  record,
  onClose,
}: {
  record: PatternRecord | null;
  onClose: () => void;
}) {
  if (!record) return null;
  return <RecordDrawerContent key={record.id} record={record} onClose={onClose} />;
}

function RecordDrawerContent({
  record,
  onClose,
}: {
  record: PatternRecord;
  onClose: () => void;
}) {
  const { saveRecord, deleteRecord } = useRecordsStore();
  const [draft, setDraft] = useState<PatternRecord>(record);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysisValue: PatternAnalysisResult = {
    product: draft.product,
    productCategory: draft.productCategory,
    journeyStage: draft.journeyStage,
    screenshotState: draft.screenshotState,
    patternName: draft.patternName,
    patternCategory: draft.patternCategory,
    userProblem: draft.userProblem,
    aiCapability: draft.aiCapability,
    uiAnatomy: draft.uiAnatomy,
    interactionRule: draft.interactionRule,
    systemFeedback: draft.systemFeedback,
    trustMechanism: draft.trustMechanism,
    failureHandling: draft.failureHandling,
    reuseLevel: draft.reuseLevel,
    designJudgment: draft.designJudgment,
    lensScore: draft.lensScore,
    tags: draft.tags,
  };

  async function saveDraft() {
    await saveRecord({ ...draft, updatedAt: new Date().toISOString() });
    toast.success("记录已更新。");
  }

  async function removeDraft() {
    if (!window.confirm(`确认删除 ${draft.patternId}？`)) return;
    await deleteRecord(draft.id);
    toast.success("记录已删除。");
    onClose();
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(recordToMarkdown(draft));
    toast.success("Markdown 已复制。");
  }

  async function reanalyze() {
    if (!draft.imageDataUrl) {
      toast.error("该记录没有截图，无法重新分析。");
      return;
    }
    if (!draft.rawNote?.trim()) {
      toast.error("该记录没有备注，无法重新分析。请先填写 Raw Note。");
      return;
    }

    setIsAnalyzing(true);
    try {
      await ensureAuth();

      // 压缩图片避免超云函数 6MB 入参限制
      const compressedImage = await compressImage(draft.imageDataUrl);
      console.log(`[reanalyze] 图片压缩: ${(draft.imageDataUrl.length / 1024 / 1024).toFixed(1)}MB → ${(compressedImage.length / 1024 / 1024).toFixed(1)}MB`);

      const rawPayload = await callCloudFunction<Record<string, unknown>>("ai-analyze-pattern", {
        imageDataUrl: compressedImage,
        rawNote: draft.rawNote,
        product: draft.product,
        sourceUrl: draft.sourceUrl ?? "",
        taskContext: draft.taskContext ?? "",
      });

      // 云函数通过 _serialized 字符串返回完整结果，防止 CloudBase 传输层丢弃空值属性
      const payload = (rawPayload && typeof rawPayload._serialized === "string")
        ? JSON.parse(rawPayload._serialized)
        : rawPayload;

      // 防御性处理 AI 返回数据
      const sanitized = sanitizePayload(payload);

      setDraft((prev) => ({
        ...prev,
        ...sanitized,
        updatedAt: new Date().toISOString(),
      }));
      toast.success("重新分析完成，请检查并保存。");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "重新分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="inspector-overlay absolute inset-0" onClick={onClose} />
      <aside className="inspector-panel absolute inset-y-0 right-0 flex w-[min(600px,90vw)] flex-col">
        <header className="page-gutter-x flex items-start justify-between gap-3 border-b border-[var(--border)] py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <TypedIdBadge kind="pattern">{draft.patternId}</TypedIdBadge>
              <TypedIdBadge kind="evidence">{draft.screenshotId}</TypedIdBadge>
            </div>
            <h2 className="display-serif mt-1.5 truncate text-[18px]">{draft.patternName}</h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-weak)]">
              {formatDate(draft.createdAt)} · 更新于 {formatDate(draft.updatedAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={copyMarkdown}>
              复制 MD
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                downloadTextFile(
                  `${draft.patternId}.json`,
                  recordsToJson([draft]),
                  "application/json",
                )
              }
            >
              JSON
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={reanalyze}
              disabled={isAnalyzing}
            >
              <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
              {isAnalyzing ? "分析中…" : "重新分析"}
            </Button>
            <Button size="sm" onClick={saveDraft}>
              保存
            </Button>
            <Button variant="danger" size="sm" onClick={removeDraft}>
              删除
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="关闭">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          <section className="page-gutter border-b border-[var(--border)]">
            <SectionLabel>证据 Evidence</SectionLabel>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draft.imageDataUrl}
              alt={draft.screenshotId}
              className="max-h-48 w-full rounded-[var(--radius-md)] object-contain"
            />
            <div className="mt-2 space-y-2">
              <Field label="原始备注 Raw Note" compact>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={draft.rawNote}
                  onChange={(e) => setDraft({ ...draft, rawNote: e.target.value })}
                />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="来源链接 Source URL" compact>
                  <input
                    className={inputClass}
                    value={draft.sourceUrl ?? ""}
                    onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}
                  />
                </Field>
                <Field label="当时任务 Task Context" compact>
                  <input
                    className={inputClass}
                    placeholder="例如：让 AI 重构 auth 模块…"
                    value={draft.taskContext ?? ""}
                    onChange={(e) => setDraft({ ...draft, taskContext: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="page-gutter">
            <PanelHeader title="模式分析 Pattern Analysis" />
            <RecordForm
              value={analysisValue}
              onChange={(next) => setDraft({ ...draft, ...next })}
            />
          </section>
        </div>
      </aside>
    </div>
  );
}

/**
 * 压缩图片 base64，确保不超过云函数 6MB 入参限制
 */
async function compressImage(dataUrl: string): Promise<string> {
  if (dataUrl.length < 2_000_000) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX_W = 1920;
      const MAX_H = 1920;
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      if (w > MAX_W || h > MAX_H) {
        const ratio = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      let result = canvas.toDataURL("image/jpeg", 0.75);
      if (result.length > 4_000_000) {
        for (const q of [0.6, 0.5, 0.4]) {
          result = canvas.toDataURL("image/jpeg", q);
          if (result.length <= 4_000_000) break;
        }
      }

      URL.revokeObjectURL(img.src as string);
      resolve(result);
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = dataUrl;
  });
}

/**
 * 防御性处理 AI 返回数据
 */
function sanitizePayload(raw: Record<string, unknown>): Record<string, unknown> {
  const safeStr = (v: unknown, fallback = ""): string => {
    if (v === null || v === undefined) return fallback;
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch { return fallback; }
  };

  const safeObj = (v: unknown): Record<string, unknown> => {
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    return {};
  };

  return {
    patternName: safeStr(raw.patternName),
    patternCategory: safeStr(raw.patternCategory),
    product: safeStr(raw.product),
    productCategory: safeStr(raw.productCategory),
    journeyStage: safeStr(raw.journeyStage),
    screenshotState: safeStr(raw.screenshotState),
    userProblem: safeStr(raw.userProblem),
    aiCapability: safeStr(raw.aiCapability),
    uiAnatomy: safeStr(raw.uiAnatomy),
    interactionRule: safeStr(raw.interactionRule),
    systemFeedback: safeStr(raw.systemFeedback),
    trustMechanism: safeStr(raw.trustMechanism),
    failureHandling: safeStr(raw.failureHandling),
    reuseLevel: safeStr(raw.reuseLevel, "Low"),
    designJudgment: safeStr(raw.designJudgment),
    lensScore: raw.lensScore && typeof raw.lensScore === "object" ? raw.lensScore : {},
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
}
