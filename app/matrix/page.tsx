"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CORE_JOURNEY_STAGES,
  JOURNEY_STAGES,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  labelOf,
} from "@/lib/constants";
import { useRecordsStore } from "@/lib/records-store";
import { computeMatrixCoverage, getMatrixCellRecords } from "@/lib/stats";
import { average, cn, journeyCode, journeyName } from "@/lib/utils";
import { PageBody, PageFrame, PageHeader, Panel, StatMetric, TypedIdBadge } from "@/components/ui";

function recordsHref(params: Record<string, string>) {
  return `/records?${new URLSearchParams(params).toString()}`;
}

export default function MatrixPage() {
  const router = useRouter();
  const { records, loadRecords } = useRecordsStore();

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const coverage = useMemo(() => computeMatrixCoverage(records), [records]);

  return (
    <PageFrame>
      <PageHeader
        title="矩阵"
        description="产品类型 × 旅程阶段 — 方法论覆盖地图。"
        stats={
          <>
            <StatMetric label="模式数" value={records.length} compact />
            <StatMetric label="矩阵格" value={`${coverage.filled}/${coverage.total}`} compact />
            <StatMetric label="覆盖率" value={`${coverage.percent}%`} compact />
          </>
        }
      />
      <PageBody className="page-section-gap">
        <Panel className="filter-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-[var(--text)]">覆盖判断</div>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                横向比较产品类型，纵向观察 J-03 到 J-07 的 AI 核心交互阶段是否形成模式密度。点击单元格或合计可下钻到对应记录。
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-[var(--text-muted)]">
              <span className="rounded-[var(--radius-sm)] bg-[var(--accent-muted)] px-2 py-1 text-[var(--accent-strong)]">
                核心阶段
              </span>
              <span className="rounded-[var(--radius-sm)] bg-[var(--panel-muted)] px-2 py-1">
                已有记录
              </span>
              <span className="rounded-[var(--radius-sm)] bg-[var(--panel)] px-2 py-1">
                待采样
              </span>
            </div>
          </div>
        </Panel>

        <Panel noPadding className="table-scroll">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-32 bg-[var(--panel-muted)]">阶段</th>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <th key={cat}>{labelOf(cat, PRODUCT_CATEGORY_LABELS)}</th>
                ))}
                <th className="w-16">合计</th>
              </tr>
            </thead>
            <tbody>
              {JOURNEY_STAGES.map((stage) => {
                const isCore = CORE_JOURNEY_STAGES.some((s) => s === stage);
                const rowTotal = records.filter((r) => r.journeyStage === stage).length;
                return (
                  <tr key={stage}>
                    <th
                      className={cn(
                        "sticky left-0 z-10 w-32 bg-[var(--panel-muted)] px-2 py-1.5 text-left",
                        isCore && "matrix-row-label--core",
                      )}
                    >
                      <TypedIdBadge kind="stage">{journeyCode(stage)}</TypedIdBadge>
                      <div className={cn("mt-0.5 text-[11px]", isCore ? "font-semibold" : "text-[var(--text-muted)]")}>
                        {journeyName(stage)}
                      </div>
                      {isCore ? (
                        <div className="mt-0.5 text-[9px] font-medium uppercase text-[var(--accent)]">核心</div>
                      ) : null}
                    </th>
                    {PRODUCT_CATEGORIES.map((cat) => {
                      const cell = getMatrixCellRecords(records, cat, stage);
                      const products = [...new Set(cell.map((r) => r.product).filter(Boolean))];
                      const avgReuse = average(cell.map((r) => r.lensScore?.reusability ?? 0));
                      const filled = cell.length > 0;
                      return (
                        <td
                          key={`${stage}-${cat}`}
                          className={cn(
                            "matrix-cell",
                            filled ? "matrix-cell--filled" : "matrix-cell--empty",
                            isCore && "matrix-cell--core",
                            filled && "cursor-pointer hover:bg-[var(--accent-muted)]",
                          )}
                          title={filled ? `在记录中查看该格 ${cell.length} 条记录` : undefined}
                          onClick={() =>
                            filled &&
                            router.push(recordsHref({ productCategory: cat, journeyStage: stage }))
                          }
                        >
                          {filled ? (
                            <>
                              <div className="text-[10px] text-[var(--text-muted)]">
                                <strong className="tabular-nums text-[var(--text)]">{cell.length}</strong>{" "}
                                条模式记录
                              </div>
                              <div className="mt-1 space-y-0.5">
                                {cell.slice(0, 3).map((r) => (
                                  <div key={r.id} className="truncate text-[11px] font-medium">{r.patternName}</div>
                                ))}
                              </div>
                              <div className="mt-1 text-[10px] text-[var(--text-weak)]">
                                平均复用性 {avgReuse.toFixed(1)}
                                {products.length ? ` · ${products.slice(0, 2).join(", ")}` : ""}
                              </div>
                              <div className="matrix-density-bar" aria-hidden>
                                {[0, 1, 2, 3].map((i) => (
                                  <span key={i} data-active={i < Math.min(cell.length, 4)} />
                                ))}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-[10px] font-medium uppercase text-[var(--text-weak)]">空</div>
                              <div className="mt-1 text-[10px] text-[var(--text-weak)]">0 条模式</div>
                            </>
                          )}
                        </td>
                      );
                    })}
                    <td
                      className={cn(
                        "matrix-col-total text-center align-middle",
                        isCore && "matrix-cell--core",
                        rowTotal > 0 && "cursor-pointer hover:bg-[var(--accent-muted)]",
                      )}
                      title={rowTotal > 0 ? `查看 ${journeyName(stage)} 阶段全部记录` : undefined}
                      onClick={() =>
                        rowTotal > 0 && router.push(recordsHref({ journeyStage: stage }))
                      }
                    >
                      <span className="tabular-nums mono text-[13px]">{rowTotal}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th className="sticky left-0 z-10">合计</th>
                {PRODUCT_CATEGORIES.map((cat) => {
                  const colTotal = records.filter((r) => r.productCategory === cat).length;
                  return (
                    <td
                      key={cat}
                      className={cn(colTotal > 0 && "cursor-pointer hover:bg-[var(--accent-muted)]")}
                      title={colTotal > 0 ? `查看 ${labelOf(cat, PRODUCT_CATEGORY_LABELS)} 全部记录` : undefined}
                      onClick={() =>
                        colTotal > 0 && router.push(recordsHref({ productCategory: cat }))
                      }
                    >
                      {colTotal}
                    </td>
                  );
                })}
                <td className="matrix-col-total">
                  <span className="text-[13px]">{records.length}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </Panel>
      </PageBody>
    </PageFrame>
  );
}
