import type { Job } from "@/lib/types";

export type Freshness = "hot" | "fresh" | "ok" | "old";

export function jobDate(job: Pick<Job, "posted_at" | "first_seen_at">) {
  return new Date(job.posted_at ?? job.first_seen_at);
}

export function hoursSince(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (Date.now() - d.getTime()) / 36e5;
}

export function freshnessOf(job: Pick<Job, "posted_at" | "first_seen_at">): Freshness {
  const h = hoursSince(jobDate(job));
  if (h < 24) return "hot";
  if (h < 72) return "fresh";
  if (h <= 120) return "ok";
  return "old";
}

export const FRESHNESS_LABEL: Record<Freshness, string> = {
  hot: "Hot",
  fresh: "Fresh",
  ok: "Recent",
  old: "Older",
};

export function timeAgo(date: Date | string) {
  const h = hoursSince(date);
  if (h < 1 / 60) return "just now";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min ago`;
  if (h < 24) return `${Math.round(h)} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

export function postedLabel(job: Pick<Job, "posted_at" | "first_seen_at">) {
  return job.posted_at ? `Posted ${timeAgo(job.posted_at)}` : `First seen ${timeAgo(job.first_seen_at)}`;
}

export function scoreBand(score: number | null | undefined) {
  if (score == null) return "none" as const;
  if (score >= 90) return "top" as const;
  if (score >= 75) return "good" as const;
  return "low" as const;
}

export function remoteLabel(r: Job["remote_type"]) {
  return { onsite: "On-site", hybrid: "Hybrid", remote: "Remote", unknown: "Work type not stated" }[r];
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
