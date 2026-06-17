"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  Archive,
  BarChart3,
  Boxes,
  Download,
  FileSearch,
  Grid3X3,
  Lightbulb,
  Loader2,
  LogOut,
} from "lucide-react";
import { useRecordsStore } from "@/lib/records-store";
import { useAuthStore } from "@/lib/auth-store";
import { computeMatrixCoverage } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { CoverageBar } from "@/components/research-ui";
import { LoginGate } from "@/components/login-gate";

const navGroups = [
  {
    kicker: "采集 Capture",
    hint: "输入",
    items: [{ href: "/capture", label: "采集", en: "Capture", icon: FileSearch }],
  },
  {
    kicker: "分析视图 Analyze",
    hint: "同一批记录的四个透镜",
    items: [
      { href: "/records", label: "记录", en: "Records", icon: Archive },
      { href: "/matrix", label: "矩阵", en: "Matrix", icon: Grid3X3 },
      { href: "/journey", label: "旅程", en: "Journey", icon: BarChart3 },
      { href: "/library", label: "模式库", en: "Library", icon: Boxes },
    ],
  },
  {
    kicker: "报告产出 Output",
    hint: "产出",
    items: [
      { href: "/insights", label: "洞察", en: "Insights", icon: Lightbulb },
      { href: "/export", label: "导出", en: "Export", icon: Download },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCaptureWorkbench = pathname === "/capture";
  const { records, loadRecords } = useRecordsStore();
  const { status, email, init, signOut } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (status === "authed") loadRecords();
  }, [status, loadRecords]);

  const products = useMemo(
    () => new Set(records.map((r) => r.product).filter(Boolean)).size,
    [records],
  );
  const highReuse = useMemo(
    () => records.filter((r) => r.reuseLevel === "High").length,
    [records],
  );
  const coverage = useMemo(() => computeMatrixCoverage(records), [records]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (status === "guest") {
    return <LoginGate />;
  }

  return (
    <div className="app-shell flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <aside className="app-sidebar fixed inset-y-0 left-0 z-30 flex w-[var(--sidebar-width)] flex-col overflow-hidden bg-[var(--panel)]">
        <div className="shrink-0 px-5 pb-4 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] bg-[var(--accent-muted)]">
              <Boxes className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="display-serif text-[17px] leading-none text-[var(--text)]">
                Pattern Collector
              </div>
            </div>
          </div>
          <div className="mono mt-3 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-[var(--text-weak)]">
            Screenshot
            <span className="text-[var(--accent)]">→</span>
            Pattern
            <span className="text-[var(--accent)]">→</span>
            Insight
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {navGroups.map((group, groupIndex) => (
            <div key={group.kicker} className={cn(groupIndex > 0 && "mt-4")}>
              <div className="mono mb-1 px-2 text-[9px] uppercase tracking-[0.2em] text-[var(--text-weak)]">
                {group.kicker}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative mb-0.5 flex h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 transition",
                      isActive
                        ? "bg-[var(--accent-muted)] text-[var(--text)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]",
                    )}
                  >
                    {isActive ? (
                      <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-[var(--accent)]" />
                    ) : null}
                    <Icon
                      className={cn(
                        "h-[15px] w-[15px] shrink-0 transition-colors",
                        isActive
                          ? "text-[var(--accent)]"
                          : "text-[var(--text-weak)] group-hover:text-[var(--text-muted)]",
                      )}
                      strokeWidth={1.75}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-4">{item.label}</span>
                    </span>
                    <span className="mono text-[9px] uppercase tracking-tight text-[var(--text-weak)]">
                      {item.en}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--border)] px-5 pb-6 pt-4">
          <div className="mono mb-3 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-[var(--text-weak)]">
            <span>Coverage</span>
            <span className="text-[var(--accent)]">{coverage.percent}%</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SidebarStat label="模式记录" value={records.length} />
            <SidebarStat label="产品" value={products} />
            <SidebarStat label="高复用" value={highReuse} accent />
            <SidebarStat label="矩阵格" value={`${coverage.filled}/${coverage.total}`} />
          </div>
          <CoverageBar percent={coverage.percent} />

          <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3">
            <div className="min-w-0 flex-1">
              <div className="mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-weak)]">
                账号
              </div>
              <div
                className="truncate text-[11px] text-[var(--text-muted)]"
                title={email ?? ""}
              >
                {email ?? "—"}
              </div>
            </div>
            <button
              onClick={() => signOut()}
              title="登出"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-weak)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "ml-[var(--sidebar-width)] flex min-h-0 min-w-0 flex-1 flex-col",
          isCaptureWorkbench ? "h-screen overflow-hidden" : "min-h-screen",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SidebarStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--panel-muted)] px-2.5 py-2">
      <div
        className={cn(
          "tabular-nums mono text-[16px] font-medium leading-none",
          accent ? "text-[var(--accent)]" : "text-[var(--text)]",
        )}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10px] text-[var(--text-weak)]">{label}</div>
    </div>
  );
}
