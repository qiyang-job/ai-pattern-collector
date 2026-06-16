"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getLatestInsights } from "@/lib/db";
import { PATTERN_CATEGORIES } from "@/lib/constants";
import {
  recordsToCsv,
  recordsToJson,
  recordsToMarkdownReport,
} from "@/lib/export";
import { useRecordsStore } from "@/lib/records-store";
import type { InsightsResult, PatternCategory } from "@/lib/types";
import { downloadTextFile } from "@/lib/utils";
import {
  Button,
  PageBody,
  PageHeader,
  Panel,
  PanelHeader,
  SegmentedControl,
  selectClass,
} from "@/components/ui";
import { SlotEmpty } from "@/components/research-ui";

type ExportFormat = "json" | "csv" | "markdown";
type ExportScope = "all" | "high-reuse" | "category";

export default function ExportPage() {
  const { records, loadRecords } = useRecordsStore();
  const [latestInsights, setLatestInsights] = useState<InsightsResult | null>(null);
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [scope, setScope] = useState<ExportScope>("all");
  const [category, setCategory] = useState<PatternCategory>(PATTERN_CATEGORIES[0]);

  useEffect(() => {
    loadRecords();
    getLatestInsights().then((v) => {
      if (!v) return;
      try {
        setLatestInsights(JSON.parse(v));
      } catch {
        setLatestInsights(null);
      }
    });
  }, [loadRecords]);

  const exportRecords = useMemo(() => {
    if (scope === "high-reuse") return records.filter((r) => r.reuseLevel === "High");
    if (scope === "category") return records.filter((r) => r.patternCategory === category);
    return records;
  }, [records, scope, category]);

  const hasData = records.length > 0;

  const preview = useMemo(() => {
    if (!hasData) {
      return `# AI 产品设计模式研究报告

## 1. 研究范围
（等待采集记录）

## 2. 模式摘要
…

请至少保存一条模式记录以启用导出预览。`;
    }
    if (format === "json") return recordsToJson(exportRecords).slice(0, 1800) + "\n…";
    if (format === "csv") return recordsToCsv(exportRecords).slice(0, 1800) + "\n…";
    return recordsToMarkdownReport(exportRecords, latestInsights).slice(0, 2500) + "\n…";
  }, [exportRecords, format, latestInsights, hasData]);

  const date = new Date().toISOString().slice(0, 10);

  function download() {
    if (!exportRecords.length) return;
    if (format === "json") {
      downloadTextFile(`patterns-${date}.json`, recordsToJson(exportRecords), "application/json");
    } else if (format === "csv") {
      downloadTextFile(`patterns-${date}.csv`, recordsToCsv(exportRecords), "text/csv");
    } else {
      downloadTextFile(
        `report-${date}.md`,
        recordsToMarkdownReport(exportRecords, latestInsights),
        "text/markdown",
      );
    }
    toast.success("已下载。");
  }

  async function copyPreview() {
    await navigator.clipboard.writeText(preview.replace(/\n…$/, ""));
    toast.success("已复制。");
  }

  return (
    <div>
      <PageHeader
        title="导出"
        description="导出控制台 — JSON · CSV · Markdown 研究报告。"
      />
      <PageBody className="space-y-3">
        <Panel noPadding className="p-3">
          <PanelHeader title="导出设置" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-[11px] font-medium text-[var(--text-muted)]">格式</div>
              <SegmentedControl
                value={format}
                options={[
                  { value: "json" as const, label: "JSON" },
                  { value: "csv" as const, label: "CSV" },
                  { value: "markdown" as const, label: "Markdown" },
                ]}
                onChange={setFormat}
              />
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-medium text-[var(--text-muted)]">范围</div>
              <SegmentedControl
                value={scope}
                options={[
                  { value: "all" as const, label: "全部" },
                  { value: "high-reuse" as const, label: "高复用" },
                  { value: "category" as const, label: "按分类" },
                ]}
                onChange={setScope}
              />
            </div>
          </div>
          {scope === "category" ? (
            <div className="mt-2">
              <div className="mb-1 text-[11px] text-[var(--text-muted)]">模式分类 Pattern Category</div>
              <select
                className={selectClass}
                value={category}
                onChange={(e) => setCategory(e.target.value as PatternCategory)}
                disabled={!hasData}
              >
                {PATTERN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={download} disabled={!hasData || !exportRecords.length}>
              下载
            </Button>
            <Button variant="secondary" onClick={copyPreview} disabled={!hasData}>
              复制预览
            </Button>
            <span className="text-[11px] text-[var(--text-weak)]">
              {hasData ? `范围内 ${exportRecords.length} 条记录` : "0 条记录"}
            </span>
          </div>
          {!hasData ? (
            <div className="mt-2">
              <SlotEmpty>
                请至少保存一条模式记录以启用导出。
                <br />
                <Link href="/capture" className="text-[var(--accent)] underline">前往采集</Link>
              </SlotEmpty>
            </div>
          ) : null}
        </Panel>

        <Panel noPadding className="p-3">
          <PanelHeader title="报告预览" meta={hasData ? "已截断" : "骨架"} />
          <pre className="code-preview max-h-96">{preview}</pre>
        </Panel>
      </PageBody>
    </div>
  );
}
