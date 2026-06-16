"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
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
              className="max-h-48 w-full rounded-[var(--radius-md)] border border-[var(--border)] object-contain"
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
