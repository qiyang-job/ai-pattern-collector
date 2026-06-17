"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getLatestInsights, saveLatestInsights } from "@/lib/db";
import { useRecordsStore } from "@/lib/records-store";
import { computeRecordStats } from "@/lib/stats";
import type { InsightsResult, RecordSummary } from "@/lib/types";
import { callCloudFunction } from "@/lib/cloudbase";
import {
  Button,
  ErrorBanner,
  PageBody,
  PageFrame,
  PageHeader,
  Panel,
  PanelHeader,
  StatMetric,
  TypedIdBadge,
} from "@/components/ui";
import { DistributionRow, ReportSkeletonSection } from "@/components/research-ui";
import { CORE_JOURNEY_STAGES } from "@/lib/constants";
import { journeyCode, journeyName } from "@/lib/utils";

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
      const rawPayload = await callCloudFunction<InsightsResult>("ai-generate-insights", { records: summaries });
      // 解析 _serialized 字符串，防止 CloudBase 传输层丢弃空值属性
      const payload = (rawPayload && typeof (rawPayload as Record<string, unknown>)._serialized === "string")
        ? JSON.parse((rawPayload as Record<string, unknown>)._serialized as string)
        : rawPayload;
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
    <PageFrame>
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
      <PageBody className="page-section-gap">
        <Panel className="insight-readiness">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold text-[var(--text-muted)]">样本量阈值</div>
              <p className="mt-1 max-w-xl text-[11px] leading-5 text-[var(--text-muted)]">
                Insights 的可信度来自记录密度。先看样本规模，再判断报告适合用于初步观察还是稳定设计建议。
              </p>
            </div>
            <ul className="grid min-w-[280px] flex-1 gap-1 text-[11px] text-[var(--text-muted)] sm:grid-cols-3">
              <li><strong className="text-[var(--text)]">5+</strong> 基础洞察</li>
              <li><strong className="text-[var(--text)]">15+</strong> 跨产品对比</li>
              <li><strong className="text-[var(--text)]">30+</strong> 稳定建议</li>
            </ul>
          </div>
          {!hasRecords ? (
            <Link href="/capture" className="mt-2 inline-block text-[11px] text-[var(--accent)] underline">
              开始采集 →
            </Link>
          ) : null}
        </Panel>

        <ErrorBanner message={error} />

        {hasRecords ? (
          <div className="grid gap-[var(--section-gap)] lg:grid-cols-2">
            <Panel>
              <PanelHeader title="旅程覆盖" meta={`J-01 → J-09 · ${records.length} 条`} />
              <div className="dist-list">
                {(() => {
                  const max = Math.max(1, ...stats.journeyCounts.map((i) => i.count));
                  return stats.journeyCounts.map((item) => {
                    const isCore = CORE_JOURNEY_STAGES.some((s) => s === item.stage);
                    return (
                      <DistributionRow
                        key={item.stage}
                        label={
                          <span className="flex items-center gap-2">
                            <span className="mono text-[10px] text-[var(--text-weak)]">
                              {journeyCode(item.stage)}
                            </span>
                            {journeyName(item.stage)}
                          </span>
                        }
                        count={item.count}
                        max={max}
                        accent={isCore}
                        core={isCore}
                      />
                    );
                  });
                })()}
              </div>
            </Panel>
            <Panel>
              <PanelHeader title="产品覆盖" meta={`${stats.coveredProducts} 个产品`} />
              <div className="dist-list">
                {(() => {
                  const max = Math.max(1, ...stats.productCategoryCounts.map((i) => i.count));
                  return stats.productCategoryCounts.map((item) => (
                    <DistributionRow
                      key={item.category}
                      label={item.category}
                      count={item.count}
                      max={max}
                    />
                  ));
                })()}
              </div>
            </Panel>
          </div>
        ) : null}

        <Panel>
          <PanelHeader title="研究报告" meta={insights ? "AI 生成" : "骨架"} />
          <div className="insight-report">
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
          <Panel>
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
    </PageFrame>
  );
}
