"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PATTERN_CATEGORIES, PATTERN_CATEGORY_DESCRIPTIONS, PATTERN_CATEGORY_LABELS, labelOf } from "@/lib/constants";
import { useRecordsStore } from "@/lib/records-store";
import type { PatternCategory, PatternRecord } from "@/lib/types";
import { cn, journeyCode } from "@/lib/utils";
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

function categorySlug(category: string) {
  return `lib-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function patternCategoryCode(index: number) {
  return `P-${String(index + 1).padStart(2, "0")}`;
}

function LibraryCategoryNav({ records }: { records: PatternRecord[] }) {
  const [activeCategory, setActiveCategory] = useState<PatternCategory>(PATTERN_CATEGORIES[0]);
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
    const sections = PATTERN_CATEGORIES.map((category) => ({
      category,
      element: document.getElementById(categorySlug(category)),
    })).filter(
      (section): section is { category: PatternCategory; element: HTMLElement } =>
        Boolean(section.element),
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
        if (match) setActiveCategory(match.category);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.1, 0.25] },
    );

    for (const { element } of sections) observer.observe(element);
    return () => observer.disconnect();
  }, [records.length]);

  function jumpToCategory(category: PatternCategory) {
    setActiveCategory(category);
    lockScrollSpy();
    document.getElementById(categorySlug(category))?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <nav
      className="inline-flex max-w-full shrink-0 gap-0.5 rounded-[var(--radius-md)] bg-[var(--segment-track-bg)] p-0.5"
      aria-label="分类导航"
    >
      {PATTERN_CATEGORIES.map((category, index) => {
        const count = records.filter((r) => r.patternCategory === category).length;
        const label = labelOf(category, PATTERN_CATEGORY_LABELS);
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
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
            title={label}
            aria-label={`${patternCategoryCode(index)} ${label}`}
            onClick={() => jumpToCategory(category)}
          >
            {patternCategoryCode(index)}
          </button>
        );
      })}
    </nav>
  );
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
        title="模式库"
        description="模式图谱 — 八大设计模式分类。"
        actions={<LibraryCategoryNav records={records} />}
      />
      <PageBody className="page-section-gap">
        {PATTERN_CATEGORIES.map((category, index) => {
          const items = records.filter((r) => r.patternCategory === category);
          return (
            <Panel key={category} id={categorySlug(category)} noPadding className="library-category-section overflow-hidden">
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
                    <tr className="library-table-category-row">
                      <th colSpan={3} className="library-table-category-title">
                        <span className="library-category-header-code mono">{patternCategoryCode(index)}</span>
                        <span>{labelOf(category, PATTERN_CATEGORY_LABELS)}</span>
                      </th>
                      <th colSpan={3} className="library-table-category-meta">
                        {PATTERN_CATEGORY_DESCRIPTIONS[category]}
                      </th>
                    </tr>
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
                      <tr key={r.id} data-clickable="true" onClick={() => setSelected(r)}>
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
                        <td className="library-cell-problem">
                          <div className="library-cell-problem-text" title={r.userProblem}>
                            {r.userProblem}
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
                      <span className="library-category-header-code mono">{patternCategoryCode(index)}</span>
                      <span>{labelOf(category, PATTERN_CATEGORY_LABELS)}</span>
                    </h2>
                    <p className="library-category-header-meta m-0 min-w-0 max-w-[46%] shrink-0 text-right">
                      {PATTERN_CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  </div>
                <div className="page-gutter">
                  <SlotEmpty>
                    该分类下尚无模式。
                    <br />
                    采集截图以填充此模式分组。
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
