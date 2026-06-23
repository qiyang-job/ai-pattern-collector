"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropdownSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

function normalizeOptions<T extends string>(
  options: readonly T[],
  optionLabels?: Record<string, string>,
): DropdownSelectOption<T>[] {
  return options.map((value) => ({
    value,
    label: optionLabels?.[value] ?? value,
  }));
}

function buildMenuItems<T extends string>(
  items: DropdownSelectOption<T>[],
  placeholder?: string,
): DropdownSelectOption<T>[] {
  const list: DropdownSelectOption<T>[] = [];
  if (placeholder) {
    list.push({ value: "" as T, label: placeholder });
  }
  for (const item of items) {
    if (placeholder && item.value === ("" as T)) continue;
    list.push(item);
  }
  return list;
}

export function DropdownSelect<T extends string>({
  value,
  options,
  optionLabels,
  onChange,
  placeholder,
  disabled,
  size = "md",
  variant = "default",
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value: T;
  options: readonly T[];
  optionLabels?: Record<string, string>;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  variant?: "default" | "filter";
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const autoId = useId();
  const listboxId = `${id ?? autoId}-listbox`;
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const items = useMemo(
    () => normalizeOptions(options, optionLabels),
    [options, optionLabels],
  );

  const menuItems = useMemo(
    () => buildMenuItems(items, placeholder),
    [items, placeholder],
  );

  const selected = items.find((item) => item.value === value);
  const hasSelection = Boolean(selected && (selected.value !== "" || !placeholder));
  const displayLabel =
    selected && (selected.value !== "" || !placeholder)
      ? selected.label
      : placeholder ?? selected?.label ?? "";

  const isFilterActive = variant === "filter" && hasSelection && value !== "";

  const pick = useCallback(
    (next: T) => {
      onChange(next);
      setOpen(false);
    },
    [onChange],
  );

  const openMenu = useCallback(() => {
    const idx = menuItems.findIndex((item) => item.value === value);
    setHighlightIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }, [menuItems, value]);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onDocumentMouseDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function onDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % menuItems.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const item = menuItems[highlightIndex];
        if (item) pick(item.value);
      }
    }

    function onScroll(event: Event) {
      const target = event.target;
      if (target instanceof Node) {
        const menu = rootRef.current?.querySelector(".dropdown-select-menu");
        if (menu && (target === menu || menu.contains(target))) {
          return;
        }
      }
      closeMenu();
    }

    document.addEventListener("mousedown", onDocumentMouseDown);
    document.addEventListener("keydown", onDocumentKeyDown);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
      document.removeEventListener("keydown", onDocumentKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, closeMenu, menuItems, highlightIndex, pick]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[highlightIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, open]);

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openMenu();
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        "dropdown-select",
        size === "sm" ? "dropdown-select--sm" : "dropdown-select--md",
        variant === "filter" && "dropdown-select--filter",
        isFilterActive && "dropdown-select--active",
        className,
      )}
    >
      <button
        id={id}
        type="button"
        className="dropdown-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
      >
        <span
          className={cn(
            "dropdown-select-value",
            !hasSelection && placeholder && "dropdown-select-value--placeholder",
          )}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={cn("dropdown-select-chevron shrink-0", open && "dropdown-select-chevron--open")}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open ? (
        <ul id={listboxId} role="listbox" className="dropdown-select-menu" aria-label={ariaLabel}>
          {menuItems.map((item, index) => {
            const isSelected = item.value === value;
            const isHighlighted = index === highlightIndex;
            return (
              <li
                key={item.value || "__empty__"}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                aria-selected={isSelected}
                className={cn(
                  "dropdown-select-option",
                  isSelected && "dropdown-select-option--selected",
                  isHighlighted && "dropdown-select-option--highlighted",
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => pick(item.value)}
              >
                <span className="dropdown-select-option-label">{item.label}</span>
                {isSelected ? (
                  <Check className="dropdown-select-check shrink-0" strokeWidth={2.25} aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
