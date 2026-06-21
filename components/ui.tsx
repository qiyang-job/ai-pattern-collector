import type { ReactNode } from "react";
import { Info } from "lucide-react";
import type { PatternCategory, ProductCategory, ReuseLevel } from "@/lib/types";
import { REUSE_LEVEL_LABELS, labelOf } from "@/lib/constants";
import {
  PATTERN_CATEGORY_COLORS,
  PRODUCT_CATEGORY_COLORS,
  REUSE_LEVEL_COLORS,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/* ─── Layout ─── */

export function PageHeader({
  title,
  description,
  stats,
  actions,
}: {
  title: string;
  description?: ReactNode;
  stats?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header page-gutter-x">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <h1 className="display-serif text-[clamp(20px,2vw,26px)] leading-none text-[var(--text)]">
            {title}
          </h1>
          {description ? (
            <div className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[var(--text-muted)]">
              {description}
            </div>
          ) : null}
        </div>
        {stats || actions ? (
          <div
            className={cn(
              "page-header-toolbar",
              !actions && "page-header-toolbar--stats-only",
              !stats && "page-header-toolbar--actions-only",
            )}
          >
            {stats ? <div className="page-header-stats">{stats}</div> : null}
            {actions ? <div className="page-header-actions">{actions}</div> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <main className={cn("page-gutter flex-1", className)}>{children}</main>;
}

export function Panel({
  children,
  className,
  noPadding,
  id,
}: {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "panel rounded-[var(--radius-lg)] bg-[var(--panel)]",
        !noPadding && "p-[var(--page-gutter)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function InfoHint({ children }: { children: ReactNode }) {
  return (
    <span className="info-hint">
      <button
        type="button"
        className="info-hint-trigger focus-ring"
        aria-label="查看说明"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      </button>
      <span className="info-hint-tooltip" role="tooltip">
        {children}
      </span>
    </span>
  );
}

export function PanelHeader({
  title,
  meta,
  hint,
  actions,
}: {
  title: string;
  meta?: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="panel-header mb-4 flex items-start justify-between gap-3 pb-2">
      <div className="flex items-center gap-2.5">
        <h2 className="display-serif text-[16px] text-[var(--text)]">{title}</h2>
        {hint ? <InfoHint>{hint}</InfoHint> : null}
        {meta ? (
          <span className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-weak)]">
            {meta}
          </span>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function PageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex min-h-full flex-1 flex-col", className)}>{children}</div>;
}

export function DualLabel({ zh }: { zh: string; en?: string }) {
  return <span>{zh}</span>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      {children}
    </div>
  );
}

/* ─── Controls ─── */

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "text";
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex items-center justify-center rounded-[var(--radius-md)] border font-medium transition active:translate-y-px",
        size === "sm" ? "h-8 px-2.5 text-[12px]" : "h-9 px-4 text-[13px]",
        variant === "primary" &&
          "border-[var(--accent)] bg-[var(--accent)] text-[#1a1305] hover:bg-[var(--accent-strong)] hover:border-[var(--accent-strong)]",
        variant === "secondary" &&
          "border-[var(--border-strong)] bg-[var(--panel-muted)] text-[var(--text)] hover:border-[var(--text-weak)] hover:bg-[var(--panel-raised)]",
        variant === "danger" &&
          "border-[var(--danger)] bg-[var(--danger)] text-[#1a0805] hover:brightness-110",
        variant === "ghost" &&
          "border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]",
        variant === "text" &&
          "h-auto border-transparent bg-transparent px-1 py-0 text-[12px] text-[var(--text-muted)] underline-offset-2 hover:text-[var(--accent)] hover:underline",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  compact,
}: {
  label: ReactNode;
  hint?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("block", compact ? "space-y-0.5" : "space-y-1")}>
      <span className="flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)]">
        {label}
        {hint ? <span className="font-normal text-[var(--text-weak)]">{hint}</span> : null}
      </span>
      {children}
    </div>
  );
}

export const inputClass =
  "focus-ring h-9 w-full rounded-[var(--radius-sm)] border-0 bg-[var(--border)] px-2.5 text-[13px] text-[var(--text)] transition placeholder:text-[var(--text-weak)]";

export const textareaClass =
  "focus-ring min-h-[52px] w-full resize-y rounded-[var(--radius-sm)] border-0 bg-[var(--border)] px-2.5 py-1.5 text-[13px] leading-5 text-[var(--text)] transition placeholder:text-[var(--text-weak)]";

/** 表单网格内 textarea：固定 4 行高度、禁止拖拽改变尺寸 */
export const formTextareaClass = cn(
  textareaClass,
  "h-[104px] max-h-[104px] min-h-[104px] resize-none overflow-y-auto",
);

export const selectClass = cn(inputClass, "select-field h-9 cursor-pointer");

export type IdBadgeKind = "evidence" | "pattern" | "stage" | "lens";

const ID_BADGE_STYLES: Record<IdBadgeKind, string> = {
  evidence:
    "bg-[var(--panel-raised)] text-[var(--text-muted)]",
  pattern:
    "bg-[var(--accent-muted)] text-[var(--accent-strong)]",
  stage:
    "bg-[var(--data-muted)] text-[var(--data)]",
  lens: "bg-[var(--panel-muted)] text-[var(--text-muted)]",
};

export function TypedIdBadge({
  kind,
  children,
  className,
}: {
  kind: IdBadgeKind;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mono inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-[2px] text-[11px] font-semibold tracking-tight",
        ID_BADGE_STYLES[kind],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Generic ID badge — prefer TypedIdBadge */
export function IdBadge({ children, className }: { children: ReactNode; className?: string }) {
  return <TypedIdBadge kind="lens" className={className}>{children}</TypedIdBadge>;
}

export function CategoryTag({
  label,
  category,
  reuseLevel,
}: {
  label: string;
  category?: ProductCategory | PatternCategory;
  reuseLevel?: ReuseLevel;
}) {
  const fallback = { bg: "var(--panel-muted)", text: "var(--text-muted)" };
  let style = fallback;
  if (category && category in PRODUCT_CATEGORY_COLORS) {
    style = PRODUCT_CATEGORY_COLORS[category as ProductCategory] ?? fallback;
  } else if (category && category in PATTERN_CATEGORY_COLORS) {
    style = PATTERN_CATEGORY_COLORS[category as PatternCategory] ?? fallback;
  } else if (reuseLevel && reuseLevel in REUSE_LEVEL_COLORS) {
    style = REUSE_LEVEL_COLORS[reuseLevel] ?? fallback;
  }

  return (
    <span
      className="inline-flex max-w-full truncate rounded-[var(--radius-sm)] px-1.5 py-px text-[11px] font-medium"
      style={{ background: style.bg, color: style.text }}
      title={label}
    >
      {label}
    </span>
  );
}

export function ReuseTag({ level }: { level?: ReuseLevel | null }) {
  const c =
    (level && REUSE_LEVEL_COLORS[level]) ?? {
      bg: "var(--panel-muted)",
      text: "var(--text-muted)",
    };
  return (
    <span
      className="inline-flex rounded-[var(--radius-sm)] px-1.5 py-px text-[11px] font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {level ? labelOf(level, REUSE_LEVEL_LABELS) : "—"}
    </span>
  );
}

/** @deprecated use CategoryTag or ReuseTag */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-[var(--radius-sm)] px-1.5 py-px text-[11px] font-medium",
        tone === "neutral" && "bg-[var(--panel-muted)] text-[var(--text-muted)]",
        tone === "blue" && "bg-[var(--data-muted)] text-[var(--data)]",
        tone === "green" && "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]",
        tone === "amber" && "bg-[var(--accent-muted)] text-[var(--accent-strong)]",
        tone === "red" && "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)]",
      )}
    >
      {children}
    </span>
  );
}

/* ─── Data display ─── */

export function StatMetric({
  label,
  value,
  compact,
}: {
  label: string;
  value: string | number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="stat-metric flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--panel-muted)] px-3 py-1.5">
        <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.06em] text-[var(--text-weak)]">
          {label}
        </span>
        <span className="ml-auto tabular-nums mono text-[15px] font-medium leading-none text-[var(--text)]">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="stat-metric rounded-[var(--radius-md)] bg-[var(--panel-muted)] px-4 py-3">
      <div className="tabular-nums mono text-[18px] font-medium leading-none text-[var(--text)]">
        {value}
      </div>
      <div className="mt-1.5 text-[10px] uppercase tracking-[0.06em] text-[var(--text-weak)]">
        {label}
      </div>
    </div>
  );
}

export function EvidenceThumbnail({
  src,
  alt,
  size = "sm",
  className,
}: {
  src: string;
  alt: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizes = {
    xs: "h-8 w-8",
    sm: "h-8 w-8",
    md: "h-10 w-10",
  };
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--panel-muted)] text-[10px] text-[var(--text-weak)]",
          sizes[size],
          className,
        )}
        title="录屏证据"
        aria-label={alt}
      >
        ▶
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(
        "rounded-[var(--radius-sm)] bg-[var(--panel-muted)] object-cover",
        sizes[size],
        className,
      )}
    />
  );
}

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  compact,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <div className="inline-flex max-w-full gap-0.5 rounded-[var(--radius-md)] bg-[var(--panel-muted)] p-0.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className={cn(
            "focus-ring rounded-[var(--radius-sm)] font-medium transition",
            compact ? "h-6 min-w-6 px-1.5 text-[11px]" : "h-7 min-w-7 px-2 text-[12px]",
            value === opt.value
              ? "bg-[var(--panel)] text-[var(--accent)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text)]",
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: "empty" | "ready" | "analyzing" | "analyzed";
}) {
  const map = {
    empty: { label: "缺失截图", color: "var(--text-weak)" },
    ready: { label: "证据就绪", color: "var(--warning)" },
    analyzing: { label: "分析中", color: "var(--accent)" },
    analyzed: { label: "已分析", color: "var(--success)" },
  };
  const { label, color } = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ─── States ─── */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--panel-muted)] px-6 py-10 text-center">
      <h2 className="display-serif text-[16px] text-[var(--text)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-[var(--text-muted)]">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--danger)_40%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-[12px] text-[var(--danger)]">
      {message}
    </div>
  );
}

export function LoadingState({ label = "加载中…" }: { label?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--panel)] px-3 py-2 text-[12px] text-[var(--text-muted)]">
      {label}
    </div>
  );
}

export function Divider() {
  return <hr className="border-0 border-t border-[var(--border)]" />;
}
