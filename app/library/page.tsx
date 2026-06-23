"use client";

import { useEffect, useState } from "react";
import { PATTERN_CATEGORIES, PATTERN_CATEGORY_DESCRIPTIONS, PATTERN_CATEGORY_LABELS, labelOf } from "@/lib/constants";
import { PATTERN_CATEGORY_COLORS } from "@/lib/design-tokens";
import { useRecordsStore } from "@/lib/records-store";
import type { PatternCategory, PatternRecord } from "@/lib/types";
import { journeyCode } from "@/lib/utils";
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
import { SlotEmpty } from "@/components/research-ui";
import { RecordDrawer } from "@/components/record-drawer";

function categorySlug(category: string) {
  return `lib-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function patternCategoryCode(index: number) {
  return `P-${String(index + 1).padStart(2, "0")}`;
}

export default function LibraryPage() {
  const { records, loadRecords } = useRecordsStore();
  const [selected, setSelected] = useState<PatternRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <PageFrame className="library-page">
      <PageHeader
        eyebrow="分析视图 · 复用"
        title="模式库"
        description="按八类设计模式组织研究资产，从类别概览进入具体证据与复用判断。"
        stats={<StatMetric label="模式总数" value={records.length} compact />}
      />
      <PageBody className="page-section-gap">
        <div className="library-category-rail">
          <div className="capture-column-header capture-column-header--compact">
            <span className="capture-column-header-title">分类导航</span>
          </div>
          <div className="library-category-rail-track">
            {PATTERN_CATEGORIES.map((category, index) => {
              const count = records.filter((r) => r.patternCategory === category).length;
              const colors = PATTERN_CATEGORY_COLORS[category as PatternCategory];
              return (
                <button
                  key={category}
                  type="button"
                  className="library-category-rail-btn"
                  data-empty={count === 0}
                  style={
                    {
                      "--cat-accent": colors.text,
                      "--cat-accent-bg": colors.bg,
                    } as React.CSSProperties
                  }
                  title={labelOf(category, PATTERN_CATEGORY_LABELS)}
                  onClick={() =>
                    document
                      .getElementById(categorySlug(category))
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <span className="library-category-rail-code mono">{patternCategoryCode(index)}</span>
                  <span className="library-category-rail-name">
                    {labelOf(category, PATTERN_CATEGORY_LABELS)}
                  </span>
                  <span className="library-category-rail-count mono tabular-nums">
                    {count > 0 ? count : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {PATTERN_CATEGORIES.map((category) => {
          const items = records.filter((r) => r.patternCategory === category);
          return (
            <Panel key={category} id={categorySlug(category)} noPadding className="scroll-mt-4 overflow-hidden">
              <div className="capture-column-header library-category-header">
                <h2 className="capture-column-header-title">{labelOf(category, PATTERN_CATEGORY_LABELS)}</h2>
                <p className="library-category-header-meta">{PATTERN_CATEGORY_DESCRIPTIONS[category]}</p>
              </div>

              {items.length > 0 ? (
                <div className="library-table-scroll">
                <table className="data-table library-data-table">
                  <colgroup>
                    <col className="library-col-evidence" />
                    <col className="library-col-pattern" />
                    <col className="library-col-product" />
                    <col className="library-col-stage" />
                    <col className="library-col-reuse" />
                    <col className="library-col-problem" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>证据</th>
                      <th>模式</th>
                      <th>产品</th>
                      <th>阶段</th>
                      <th>复用</th>
                      <th>用户问题</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr
                        key={r.id}
                        data-clickable="true"
                        tabIndex={0}
                        aria-label={`打开模式记录：${r.patternName}`}
                        onClick={() => setSelected(r)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelected(r);
                          }
                        }}
                      >
                        <td className="library-cell-evidence">
                          <div className="flex items-center gap-1.5">
                            <EvidenceThumbnail src={r.imageDataUrl} alt={r.screenshotId} size="xs" className="shrink-0" />
                            <TypedIdBadge kind="evidence" className="shrink-0 text-[10px] px-1 py-[1px]">{r.screenshotId}</TypedIdBadge>
                          </div>
                        </td>
                        <td className="library-cell-stack">
                          <div className="min-w-0 overflow-hidden">
                            <div className="truncate font-medium">{r.patternName}</div>
                            <TypedIdBadge kind="pattern" className="mt-0.5 truncate text-[10px] px-1 py-[1px]">{r.patternId}</TypedIdBadge>
                          </div>
                        </td>
                        <td className="truncate text-[12px] text-[var(--text-muted)]">{r.product || "—"}</td>
                        <td><TypedIdBadge kind="stage" className="text-[10px] px-1 py-[1px]">{journeyCode(r.journeyStage)}</TypedIdBadge></td>
                        <td><ReuseTag level={r.reuseLevel} /></td>
                        <td className="truncate text-[12px] text-[var(--text-muted)]" title={r.userProblem}>
                          {r.userProblem}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              ) : (
                <div className="page-gutter">
                  <SlotEmpty>
                    该分类下尚无模式。
                    <br />
                    采集截图以填充此模式分组。
                  </SlotEmpty>
                </div>
              )}
            </Panel>
          );
        })}
      </PageBody>
      <RecordDrawer record={selected} onClose={() => setSelected(null)} />
    </PageFrame>
  );
}
