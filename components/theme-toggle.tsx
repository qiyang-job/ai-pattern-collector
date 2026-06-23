"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/lib/theme-store";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isLight ? "切换深色模式" : "切换浅色模式"}
      aria-label={isLight ? "切换深色模式" : "切换浅色模式"}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-weak)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]",
        className,
      )}
    >
      {isLight ? (
        <Moon className="h-3.5 w-3.5" strokeWidth={1.75} />
      ) : (
        <Sun className="h-3.5 w-3.5" strokeWidth={1.75} />
      )}
    </button>
  );
}
