import { cn } from "@/lib/utils";
import { FlameIcon } from "lucide-react";
import { FRESHNESS_LABEL, freshnessOf, scoreBand } from "@/lib/format";
import type { Job, SponsorStatus } from "@/lib/types";

const bandClass = {
  top: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  good: "border-sky-600/30 bg-sky-600/10 text-sky-700 dark:text-sky-400",
  low: "border-border bg-muted text-muted-foreground",
  none: "border-dashed border-border text-muted-foreground",
};

export function ScoreBadge({ score, className }: { score: number | null | undefined; className?: string }) {
  const band = scoreBand(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-xs tabular-nums",
        bandClass[band],
        className,
      )}
      title={score == null ? "Not scored yet" : `CV score ${score} out of 100`}
    >
      <span className="sr-only">CV score</span>
      {score ?? "--"}
    </span>
  );
}

export function FreshnessBadge({ job }: { job: Pick<Job, "posted_at" | "first_seen_at"> }) {
  const f = freshnessOf(job);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] uppercase",
        f === "hot" && "bg-orange-500/10 text-orange-700 dark:text-orange-400",
        f === "fresh" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        f === "ok" && "bg-muted text-muted-foreground",
        f === "old" && "bg-muted text-muted-foreground line-through",
      )}
    >
      {f === "hot" && <FlameIcon aria-hidden="true" className="size-3" />}
      {FRESHNESS_LABEL[f]}
    </span>
  );
}

const sponsorText: Record<SponsorStatus, string> = {
  confirmed: "Sponsor: confirmed",
  likely: "Sponsor: likely",
  not_stated: "Sponsor: not stated",
  no: "No sponsorship",
  not_applicable: "",
};

export function SponsorBadge({ status }: { status: SponsorStatus | undefined }) {
  if (!status || status === "not_applicable") return null;
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-1.5 py-0.5 text-[11px]",
        status === "confirmed" && "border-emerald-600/30 text-emerald-700 dark:text-emerald-400",
        status === "likely" && "border-sky-600/30 text-sky-700 dark:text-sky-400",
        status === "not_stated" && "border-dashed text-muted-foreground",
        status === "no" && "border-destructive/30 text-destructive",
      )}
    >
      {sponsorText[status]}
    </span>
  );
}

/** Score after Jai's ticked lines, never above the honest maximum. */
export function scoreAfterTicks(job: Job) {
  const s = job.score;
  if (!s) return null;
  const added = s.green_items.filter((g) => s.ticked_items.includes(g.id)).reduce((sum, g) => sum + g.points, 0);
  return Math.min(s.score_possible, s.score_now + added);
}

/** Days until a YYYY-MM-DD closing date, counting the whole last day. */
export function daysUntil(date: string) {
  return Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 864e5);
}

/** Closing date, shown first so it can't be missed. Amber within a week, red within 2 days, struck through once passed. */
export function DeadlineBadge({ deadline, source, className }: { deadline: string | null | undefined; source?: string | null; className?: string }) {
  if (!deadline) return null;
  const d = daysUntil(deadline);
  const date = new Date(`${deadline}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const left = d < 0 ? "closed" : d === 0 ? "closes today" : `${d} ${d === 1 ? "day" : "days"} left`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium text-[11px]",
        d < 0 && "border-dashed font-normal text-muted-foreground line-through",
        d >= 0 && d <= 2 && "border-destructive/40 bg-destructive/10 text-destructive",
        d > 2 && d <= 7 && "border-amber-600/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        d > 7 && "border-foreground/20",
        className,
      )}
      title={source ?? undefined}
    >
      Closes {date} · {left}
    </span>
  );
}
