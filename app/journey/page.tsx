"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CORE_JOURNEY_STAGES,
  JOURNEY_STAGE_DESCRIPTIONS,
  JOURNEY_STAGE_LABELS,
  JOURNEY_STAGES,
  labelOf,
} from "@/lib/constants";
import { useRecordsStore } from "@/lib/records-store";
import { averageLensForRecords } from "@/lib/stats";
import type { JourneyStage, PatternRecord } from "@/lib/types";
import { cn, journeyCode, journeyName } from "@/lib/utils";
import {
  EvidenceThumbnail,
  PageBody,
  PageFrame,
  PageHeader,
  Panel,
  ReuseTag,
  StatMetric,
  TypedIdBadge,
} from "@/components/ui";
import { CoreBandLabel, SlotEmpty } from "@/components/research-ui";
import { RecordDrawer } from "@/components/record-drawer";

export default function JourneyPage() {
  const { records, loadRecords } = useRecordsStore();
  const [selected, setSelected] = useState<PatternRecord | null>(null);
  const [activeStage, setActiveStage] = useState<JourneyStage>(JOURNEY_STAGES[0]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const stageRecords = records.filter((r) => r.journeyStage === activeStage);
  const products = [...new Set(stageRecords.map((r) => r.product).filter(Boolean))];
  const highReuse = stageRecords.filter((r) => r.reuseLevel === "High");
  const stageMax = Math.max(
    1,
    ...JOURNEY_STAGES.map((stage) => records.filter((r) => r.journeyStage === stage).length),
  );

  return (
    <PageFrame>
      <PageHeader
        title="旅程"
        description="用户流程研究地图 — 从 J-01 Entry 到 J-09 Handoff。"
      />
      <PageBody className="page-section-gap">
        <div className="stage-rail">
          <div className="capture-column-header">
            <CoreBandLabel />
            <span className="capture-column-header-subtitle ml-2 inline">J-03 → J-07 高亮显示</span>
          </div>
          <div className="flex w-full">
            {JOURNEY_STAGES.map((stage) => {
              const count = records.filter((r) => r.journeyStage === stage).length;
              const isCore = CORE_JOURNEY_STAGES.some((s) => s === stage);
              const isActive = activeStage === stage;
              const pct = stageMax > 0 ? Math.round((count / stageMax) * 100) : 0;
              return (
                <button
                  key={stage}
                  type="button"
                  className={cn(
                    "stage-rail-button flex flex-col border-r border-[var(--border)] px-2.5 py-2.5 text-left last:border-r-0",
                    isActive && "bg-[var(--accent-muted)]",
                    isCore && !isActive && "bg-[var(--panel-muted)]",
                    !isActive && "hover:bg-[var(--panel-muted)]",
                    isCore && "stage-rail-button--core",
                  )}
                  onClick={() => setActiveStage(stage)}
                >
                  <TypedIdBadge kind="stage">{journeyCode(stage)}</TypedIdBadge>
                  <span className={cn("mt-1.5 text-[10px] leading-tight", isCore ? "font-semibold" : "text-[var(--text-muted)]")}>
                    {journeyName(stage)}
                  </span>
                  <div className="mt-2 flex items-baseline gap-1 text-[10px] text-[var(--text-weak)]">
                    <span className="tabular-nums mono text-[13px] font-medium text-[var(--text)]">{count}</span>
                    <span>条模式</span>
                  </div>
                  <div className="stage-rail-meter" aria-hidden>
                    <div className="stage-rail-meter-fill" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Panel className="filter-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-lg">
              <div className="flex items-center gap-2">
                <TypedIdBadge kind="stage">{journeyCode(activeStage)} {labelOf(activeStage, JOURNEY_STAGE_LABELS)}</TypedIdBadge>
                {CORE_JOURNEY_STAGES.some((s) => s === activeStage) ? <CoreBandLabel /> : null}
              </div>
              <p className="mt-1.5 text-[12px] leading-5 text-[var(--text-muted)]">
                {JOURNEY_STAGE_DESCRIPTIONS[activeStage]}
              </p>
              {stageRecords.length > 0 ? (
                <Link
                  href={`/records?journeyStage=${encodeURIComponent(activeStage)}`}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline"
                >
                  在记录中查看该阶段 {stageRecords.length} 条 →
                </Link>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <StatMetric label="模式数" value={stageRecords.length} compact />
              <StatMetric label="产品数" value={products.length} compact />
              <StatMetric label="平均 Lens" value={averageLensForRecords(stageRecords).toFixed(1)} compact />
              <StatMetric label="高复用" value={highReuse.length} compact />
            </div>
          </div>
        </Panel>

        <Panel noPadding className="table-scroll">
          {stageRecords.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>证据</th>
                  <th>模式</th>
                  <th>产品</th>
                  <th>复用</th>
                  <th>设计判断</th>
                </tr>
              </thead>
              <tbody>
                {stageRecords.map((r) => (
                  <tr key={r.id} data-clickable="true" onClick={() => setSelected(r)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <EvidenceThumbnail src={r.imageDataUrl} alt={r.screenshotId} />
                        <TypedIdBadge kind="evidence">{r.screenshotId}</TypedIdBadge>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{r.patternName}</div>
                      <TypedIdBadge kind="pattern" className="mt-0.5">{r.patternId}</TypedIdBadge>
                    </td>
                    <td className="text-[var(--text-muted)]">{r.product || "—"}</td>
                    <td><ReuseTag level={r.reuseLevel} /></td>
                    <td className="max-w-xs truncate text-[12px] text-[var(--text-muted)]">{r.designJudgment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="page-gutter">
              <SlotEmpty>
                {activeStage} 阶段尚无记录。采集该旅程阶段的截图以填充此视图。
              </SlotEmpty>
            </div>
          )}
        </Panel>
      </PageBody>
      <RecordDrawer record={selected} onClose={() => setSelected(null)} />
    </PageFrame>
  );
}
