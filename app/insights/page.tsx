"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getLatestInsights, saveLatestInsights } from "@/lib/db";
import { useRecordsStore } from "@/lib/records-store";
import { computeRecordStats } from "@/lib/stats";
import type { InsightsResult, RecordSummary } from "@/lib/types";
import {
  Button,
  ErrorBanner,
  PageBody,
  PageHeader,
  Panel,
  PanelHeader,
  StatMetric,
  TypedIdBadge,
} from "@/components/ui";
import { ReportSkeletonSection } from "@/components/research-ui";

const INSIGHT_KEYS: Array<{ key: keyof InsightsResult; title: string; num: string }> = [
  { key: "researchScope", title: "研究范围", num: "01" },
  { key: "productCoverage", title: "产品覆盖", num: "02" },
  { key: "journeyCoverage", title: "旅程覆盖", num: "03" },
  { key: "highValuePatterns", title: "高价值模式", num: "04" },
  { key: "crossProductComparison", title: "跨产品对比", num: "05" },
  { key: "stageMaturity", title: "阶段成熟度", num: "06" },
  { key: "designOpportunities", title: "设计机会", num: "07" },
  { key: "recommendations", title: "建议", num: "08" },
];

export default function InsightsPage() {
  const { records, loadRecords } = useRecordsStore();
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const stats = useMemo(() => computeRecordStats(records), [records]);
  const hasRecords = records.length > 0;

  useEffect(() => {
    loadRecords();
    getLatestInsights().then((v) => {
      if (!v) return;
      try {
        setInsights(JSON.parse(v));
      } catch {
        setInsights(null);
      }
    });
  }, [loadRecords]);

  async function generateInsights() {
    if (!hasRecords) return;
    setError("");
    setIsGenerating(true);
    try {
      const summaries: RecordSummary[] = records.map((r) => ({
        patternId: r.patternId,
        screenshotId: r.screenshotId,
        product: r.product,
        productCategory: r.productCategory,
        journeyStage: r.journeyStage,
        screenshotState: r.screenshotState,
        patternName: r.patternName,
        patternCategory: r.patternCategory,
        userProblem: r.userProblem,
        aiCapability: r.aiCapability,
        trustMechanism: r.trustMechanism,
        reuseLevel: r.reuseLevel,
        designJudgment: r.designJudgment,
        lensScore: r.lensScore,
        tags: r.tags,
      }));
      const res = await fetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: summaries }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "生成失败");
      setInsights(payload);
      await saveLatestInsights(JSON.stringify(payload));
      toast.success("洞察报告已生成。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "洞察生成失败");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="洞察"
        description="研究报告生成器 — 本地统计 + AI 叙事。"
        stats={
          hasRecords ? (
            <>
              <StatMetric label="记录数" value={records.length} compact />
              <StatMetric label="产品数" value={stats.coveredProducts} compact />
              <StatMetric label="平均 Lens" value={stats.averageLensScore.toFixed(1)} compact />
            </>
          ) : undefined
        }
        actions={
          <Button onClick={generateInsights} disabled={isGenerating || !hasRecords}>
            {isGenerating ? "生成中…" : "AI 生成洞察"}
          </Button>
        }
      />
      <PageBody className="space-y-3">
        <Panel noPadding className="border-[var(--accent-muted)] bg-[var(--accent-muted)]/30 p-3">
          <div className="text-[11px] font-medium text-[var(--text-muted)]">样本量阈值</div>
          <ul className="mt-1 space-y-0.5 text-[11px] text-[var(--text-muted)]">
            <li><strong className="text-[var(--text)]">5+</strong> 条记录 → 基础洞察</li>
            <li><strong className="text-[var(--text)]">15+</strong> 条记录 → 跨产品对比</li>
            <li><strong className="text-[var(--text)]">30+</strong> 条记录 → 稳定模式建议</li>
          </ul>
          {!hasRecords ? (
            <Link href="/capture" className="mt-2 inline-block text-[11px] text-[var(--accent)] underline">
              开始采集 →
            </Link>
          ) : null}
        </Panel>

        <ErrorBanner message={error} />

        {hasRecords ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel noPadding className="p-3">
              <PanelHeader title="旅程覆盖" />
              <table className="data-table">
                <tbody>
                  {stats.journeyCounts.map((item) => (
                    <tr key={item.stage}>
                      <td className="text-[12px]">{item.stage}</td>
                      <td className="tabular-nums text-right">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
            <Panel noPadding className="p-3">
              <PanelHeader title="产品覆盖" />
              <table className="data-table">
                <tbody>
                  {stats.productCategoryCounts.map((item) => (
                    <tr key={item.category}>
                      <td className="text-[12px]">{item.category}</td>
                      <td className="tabular-nums text-right">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        ) : null}

        <Panel noPadding className="p-4">
          <PanelHeader title="研究报告" meta={insights ? "AI 生成" : "骨架"} />
          <div className="max-w-2xl">
            {INSIGHT_KEYS.map(({ key, title, num }) => (
              <ReportSkeletonSection
                key={key}
                num={num}
                title={title}
                content={insights?.[key]}
                placeholder="等待采集记录"
              />
            ))}
          </div>
        </Panel>

        {hasRecords && stats.highReusePatterns.length > 0 ? (
          <Panel noPadding className="p-3">
            <PanelHeader title="高价值模式" />
            <div className="space-y-1">
              {stats.highReusePatterns.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-[12px]">
                  <TypedIdBadge kind="pattern">{r.patternId}</TypedIdBadge>
                  <span className="font-medium">{r.patternName}</span>
                  <span className="text-[var(--text-weak)]">{r.product}</span>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}
      </PageBody>
    </div>
  );
}
