"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CORE_JOURNEY_STAGES,
  JOURNEY_STAGE_DESCRIPTIONS,
  JOURNEY_STAGE_LABELS,
  JOURNEY_STAGES,
  labelOf,
} from "@/lib/constants";
import { useRecordsStore } from "@/lib/records-store";
import type { JourneyStage, PatternRecord } from "@/lib/types";
import { cn, journeyCode, journeyName } from "@/lib/utils";
import {
  EvidenceThumbnail,
  PageBody,
  PageFrame,
  PageHeader,
  Panel,
  ReuseTag,
  TypedIdBadge,
} from "@/components/ui";
import { SlotEmpty } from "@/components/research-ui";
import { RecordDrawer } from "@/components/record-drawer";

function stageSlug(stage: string) {
  return `journey-${stage.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function JourneyStageNav({ records }: { records: PatternRecord[] }) {
  const [activeStage, setActiveStage] = useState<JourneyStage>(JOURNEY_STAGES[0]);
  const scrollSpyLockedRef = useRef(false);
  const scrollSpyTimerRef = useRef<number | null>(null);

  const lockScrollSpy = useCallback((durationMs = 900) => {
    scrollSpyLockedRef.current = true;
    if (scrollSpyTimerRef.current !== null) {
      window.clearTimeout(scrollSpyTimerRef.current);
    }
    scrollSpyTimerRef.current = window.setTimeout(() => {
      scrollSpyLockedRef.current = false;
      scrollSpyTimerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollSpyTimerRef.current !== null) {
        window.clearTimeout(scrollSpyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const sections = JOURNEY_STAGES.map((stage) => ({
      stage,
      element: document.getElementById(stageSlug(stage)),
    })).filter(
      (section): section is { stage: JourneyStage; element: HTMLElement } => Boolean(section.element),
    );

    if (!sections.length) return;

    const headerAnchor = 96;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollSpyLockedRef.current) return;

        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;

        const best = visible.reduce((closest, entry) => {
          const distance = Math.abs(entry.boundingClientRect.top - headerAnchor);
          const closestDistance = Math.abs(closest.boundingClientRect.top - headerAnchor);
          return distance < closestDistance ? entry : closest;
        });

        const match = sections.find((section) => section.element === best.target);
        if (match) setActiveStage(match.stage);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.1, 0.25] },
    );

    for (const { element } of sections) observer.observe(element);
    return () => observer.disconnect();
  }, [records.length]);

  function jumpToStage(stage: JourneyStage) {
    setActiveStage(stage);
    lockScrollSpy();
    document.getElementById(stageSlug(stage))?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <nav
      className="inline-flex max-w-full shrink-0 gap-0.5 rounded-[var(--radius-md)] bg-[var(--segment-track-bg)] p-0.5"
      aria-label="旅程阶段导航"
    >
      {JOURNEY_STAGES.map((stage) => {
        const count = records.filter((r) => r.journeyStage === stage).length;
        const isActive = activeStage === stage;
        return (
          <button
            key={stage}
            type="button"
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "focus-ring mono rounded-[var(--radius-sm)] font-medium transition",
              "h-7 min-w-[2.125rem] px-2 text-[10px] tracking-tight",
              isActive
                ? "bg-[var(--panel)] text-[var(--accent)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text)]",
              count === 0 && !isActive && "opacity-45",
            )}
            title={`${journeyCode(stage)} ${journeyName(stage)}`}
            aria-label={`${journeyCode(stage)} ${journeyName(stage)}`}
            onClick={() => jumpToStage(stage)}
          >
            {journeyCode(stage)}
          </button>
        );
      })}
    </nav>
  );
}

export default function JourneyPage() {
  const { records, loadRecords } = useRecordsStore();
  const [selected, setSelected] = useState<PatternRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <PageFrame className="journey-page">
      <PageHeader
        title="旅程"
        description="用户流程研究地图 — 从 J-01 入口到 J-09 交接。"
        actions={<JourneyStageNav records={records} />}
      />
      <PageBody className="page-section-gap">
        {JOURNEY_STAGES.map((stage) => {
          const items = records.filter((r) => r.journeyStage === stage);
          const isCore = CORE_JOURNEY_STAGES.some((s) => s === stage);
          return (
            <Panel key={stage} id={stageSlug(stage)} noPadding className="library-category-section overflow-hidden">
              {items.length > 0 ? (
                <div className="library-table-scroll">
                  <table className="data-table library-data-table">
                    <colgroup>
                      <col className="library-col-evidence" />
                      <col className="library-col-pattern" />
                      <col className="library-col-product" />
                      <col className="library-col-reuse" />
                      <col className="library-col-problem" />
                    </colgroup>
                    <thead>
                      <tr className="library-table-category-row">
                        <th colSpan={2} className="library-table-category-title">
                          <span className="library-category-header-code mono">{journeyCode(stage)}</span>
                          <span>{labelOf(stage, JOURNEY_STAGE_LABELS)}</span>
                          {isCore ? (
                            <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]">
                              核心
                            </span>
                          ) : null}
                        </th>
                        <th colSpan={3} className="library-table-category-meta">
                          {JOURNEY_STAGE_DESCRIPTIONS[stage]}
                        </th>
                      </tr>
                      <tr>
                        <th>证据</th>
                        <th>模式</th>
                        <th>产品</th>
                        <th>复用</th>
                        <th>设计判断</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((r) => (
                        <tr key={r.id} data-clickable="true" onClick={() => setSelected(r)}>
                          <td className="library-cell-evidence">
                            <div className="flex items-center gap-1.5">
                              <EvidenceThumbnail src={r.imageDataUrl} alt={r.screenshotId} size="xs" className="shrink-0" />
                              <TypedIdBadge kind="evidence" className="shrink-0 text-[10px] px-1 py-[1px]">
                                {r.screenshotId}
                              </TypedIdBadge>
                            </div>
                          </td>
                          <td className="library-cell-stack">
                            <div className="min-w-0 overflow-hidden">
                              <div className="truncate font-medium">{r.patternName}</div>
                              <TypedIdBadge kind="pattern" className="mt-0.5 truncate text-[10px] px-1 py-[1px]">
                                {r.patternId}
                              </TypedIdBadge>
                            </div>
                          </td>
                          <td className="truncate text-[12px] text-[var(--text-muted)]">{r.product || "—"}</td>
                          <td>
                            <ReuseTag level={r.reuseLevel} />
                          </td>
                          <td className="library-cell-problem">
                            <div className="library-cell-problem-text" title={r.designJudgment}>
                              {r.designJudgment}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  <div className="library-category-header flex items-center justify-between gap-4 border-b border-[var(--border)]">
                    <h2 className="library-category-header-title m-0 min-w-0 text-[13px] font-semibold leading-none text-[var(--text)]">
                      <span className="library-category-header-code mono">{journeyCode(stage)}</span>
                      <span>{labelOf(stage, JOURNEY_STAGE_LABELS)}</span>
                      {isCore ? (
                        <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]">
                          核心
                        </span>
                      ) : null}
                    </h2>
                    <p className="library-category-header-meta m-0 min-w-0 max-w-[46%] shrink-0 text-right">
                      {JOURNEY_STAGE_DESCRIPTIONS[stage]}
                    </p>
                  </div>
                  <div className="page-gutter">
                    <SlotEmpty>
                      该阶段尚无模式。
                      <br />
                      采集该旅程阶段的截图以填充此视图。
                    </SlotEmpty>
                  </div>
                </>
              )}
            </Panel>
          );
        })}
      </PageBody>
      <RecordDrawer record={selected} onClose={() => setSelected(null)} />
    </PageFrame>
  );
}
