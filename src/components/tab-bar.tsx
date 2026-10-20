import { cn } from "@/lib/utils";

export type TabItem<T extends string> = { value: T; label: string; count?: number };

/** A row of tabs. The active tab gets a sliding pill; empty tabs stay visible but quiet. */
export function TabBar<T extends string>({
  items,
  value,
  onChange,
  label,
  size = "md",
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div
      aria-label={label}
      className={cn("-mx-1 flex snap-x gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]", className)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const i = items.findIndex((t) => t.value === value);
        const next = items[(i + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length];
        onChange(next.value);
        (e.currentTarget.querySelector(`[data-value="${CSS.escape(next.value)}"]`) as HTMLElement | null)?.focus();
      }}
      role="tablist"
    >
      {items.map((t) => {
        const active = t.value === value;
        return (
          <button
            aria-selected={active}
            className={cn(
              "inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 font-medium outline-none transition-[background-color,border-color,color,transform] duration-200 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:transition-none",
              size === "lg" ? "h-10 text-sm" : "h-9 text-[13px]",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground/80 hover:border-foreground/40 hover:text-foreground",
              !active && t.count === 0 && "text-muted-foreground",
            )}
            data-value={t.value}
            key={t.value}
            onClick={() => onChange(t.value)}
            role="tab"
            tabIndex={active ? 0 : -1}
            type="button"
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-center font-mono text-[11px] tabular-nums transition-colors",
                  active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
