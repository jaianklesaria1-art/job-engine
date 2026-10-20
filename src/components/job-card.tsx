import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DeadlineBadge, FreshnessBadge, ScoreBadge, SponsorBadge } from "@/components/job-bits";
import { CheckIcon, ExternalLinkIcon, StarIcon, XIcon } from "lucide-react";
import { postedLabel, remoteLabel, sourceLinks } from "@/lib/format";
import { STATUS_LABEL, type Job, type JobStatus } from "@/lib/types";
import { useData } from "@/lib/data";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Applied and Skip take the card out of the to-review list, so it fades and drops away first. */
export function useLeave(jobId: string) {
  const { setStatus } = useData();
  const [leaving, setLeaving] = useState<JobStatus | null>(null);
  const leave = (status: JobStatus) => {
    if (reducedMotion()) return void setStatus(jobId, status);
    setLeaving(status);
    setTimeout(() => void setStatus(jobId, status), 260);
  };
  return { leaving, leave };
}

export function JobCard({ job, selected, compact }: { job: Job; selected?: boolean; compact?: boolean }) {
  const { setStatus } = useData();
  const { leaving, leave } = useLeave(job.id);
  const c = job.company;
  const missing = job.score?.keywords.filter((k) => !k.present).map((k) => k.keyword) ?? [];
  const toReview = job.status === "found" || job.status === "shortlisted";

  return (
    <article
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group relative flex flex-col gap-3 bg-background p-5 outline-none transition-[background-color,opacity,transform,filter] duration-300 ease-out hover:bg-muted/30 motion-reduce:transition-none",
        selected && "bg-muted/60 ring-2 ring-ring ring-inset",
        leaving === "applied" && "pointer-events-none scale-[0.97] bg-emerald-600/10 opacity-0",
        leaving === "skipped" && "pointer-events-none translate-x-6 opacity-0 blur-[1px]",
      )}
      data-job-id={job.id}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DeadlineBadge deadline={job.deadline} source={job.deadline_source} />
          <FreshnessBadge job={job} />
          <span className="text-muted-foreground text-xs">{postedLabel(job)}</span>
        </div>
        <ScoreBadge score={job.score?.score_now} />
      </div>

      <div className="min-w-0">
        <Link className="font-heading text-xl leading-tight hover:underline" to={`/jobs/${job.id}`}>
          <span className="absolute inset-0" aria-hidden="true" />
          {job.title}
        </Link>
        <p className="mt-1 truncate text-sm">
          {job.company_name}
          <span className="text-muted-foreground">
            {" "}
            · {job.city ?? job.location ?? "Location not stated"} · {remoteLabel(job.remote_type)}
          </span>
        </p>
        {!compact && c && (c.industry || c.size_label || c.funding_stage) && (
          <p className="mt-0.5 truncate text-muted-foreground text-xs">
            {[c.industry, c.size_label && `${c.size_label} people`, c.funding_stage].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {!compact && job.score && (
        <p className="text-xs">
          <span className="font-mono tabular-nums">
            CV {job.score.score_now} → {job.score.score_possible} possible
          </span>
          {missing.length > 0 && <span className="text-muted-foreground"> · Missing: {missing.slice(0, 3).join(", ")}</span>}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SponsorBadge status={c?.sponsor_status} />
        {job.status !== "found" && (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px]",
              job.status === "shortlisted" ? "bg-amber-500/15 text-amber-800 dark:text-amber-300" : "bg-muted",
            )}
          >
            {STATUS_LABEL[job.status]}
          </span>
        )}
        {sourceLinks(job).slice(0, 3).map((l) => (
          <a
            className="relative z-10 inline-flex items-center gap-0.5 text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            href={l.url}
            key={l.url}
            onPointerDown={(e) => e.stopPropagation()}
            rel="noreferrer"
            target="_blank"
          >
            {l.label}
            <ExternalLinkIcon aria-hidden="true" className="size-3" />
            <span className="sr-only">(job post, opens in a new tab)</span>
          </a>
        ))}
      </div>

      {!compact && toReview && (
        <div className="relative z-10 mt-1 flex flex-wrap gap-2">
          <Button onClick={() => leave("applied")} size="sm" title="Mark applied (A)" variant="outline">
            <CheckIcon /> Applied
          </Button>
          {job.status === "found" && (
            <Button onClick={() => void setStatus(job.id, "shortlisted")} size="sm" title="Shortlist (S)" variant="ghost">
              <StarIcon /> Shortlist
            </Button>
          )}
          <Button className="ml-auto" onClick={() => leave("skipped")} size="sm" title="Skip for good (X)" variant="ghost">
            <XIcon /> Skip
          </Button>
        </div>
      )}
    </article>
  );
}
