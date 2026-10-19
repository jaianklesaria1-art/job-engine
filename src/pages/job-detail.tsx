import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, CheckCircle2Icon, CheckIcon, ClockIcon, Undo2Icon, CopyIcon, ExternalLinkIcon, FileTextIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "@/components/dashboard-card";
import { DeadlineBadge, FreshnessBadge, SponsorBadge, scoreAfterTicks } from "@/components/job-bits";
import { useData } from "@/lib/data";
import { postedLabel, remoteLabel, sourceLinks, timeAgo } from "@/lib/format";
import { STATUS_LABEL, type JobEvent, type ScorePart } from "@/lib/types";
import { useHotkeys } from "@/hooks/use-hotkeys";

const PARTS: { key: "skills" | "title" | "domain" | "keywords" | "location"; label: string }[] = [
  { key: "skills", label: "Must-have skills and tools" },
  { key: "title", label: "Title and seniority" },
  { key: "domain", label: "Domain" },
  { key: "keywords", label: "Nice-to-have keywords" },
  { key: "location", label: "Location and work type" },
];

const verdictText = { apply: "Apply", tailor: "Apply with tailoring", skip: "Skip" };

export function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { jobs, loading, setStatus, toggleTick, sendRequest, loadEvents, requests } = useData();
  const job = jobs.find((j) => j.id === id);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [showDesc, setShowDesc] = useState(false);

  useEffect(() => {
    if (job) void loadEvents(job.id).then(setEvents);
  }, [job?.id, job?.status, loadEvents]); // eslint-disable-line react-hooks/exhaustive-deps

  useHotkeys(
    {
      a: () => job && void setStatus(job.id, "applied"),
      s: () => job && void setStatus(job.id, "shortlisted"),
      x: () => job && void setStatus(job.id, "skipped"),
      Escape: () => navigate("/jobs"),
    },
    Boolean(job),
  );

  if (!job) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground text-sm">
        {loading ? "Loading the job..." : "This job isn't in the last 30 days of results."}{" "}
        <Link className="underline" to="/jobs">
          Back to jobs
        </Link>
      </div>
    );
  }

  const s = job.score;
  const c = job.company;
  const after = scoreAfterTicks(job);
  const applyUrl = job.apply_url ?? job.urls[0];
  const links = sourceLinks(job);
  const applied = ["applied", "contacted", "replied", "interview", "offer"].includes(job.status);
  const tailorRequest = requests.find((r) => r.kind === "tailor_cv" && r.payload.job_id === job.id);
  const tailorPending = tailorRequest?.status === "pending";
  const ticked = s?.green_items.filter((g) => s.ticked_items.includes(g.id)) ?? [];

  const copyLines = async () => {
    try {
      await navigator.clipboard.writeText(ticked.map((g) => `\\item ${g.line}`).join("\n"));
      toast.success(`Copied ${ticked.length} ${ticked.length === 1 ? "line" : "lines"} for Overleaf.`, { description: "Paste them into the right job in your CV." });
    } catch {
      toast.error("Couldn't copy. Select the lines by hand instead.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button className="-ml-2 mb-3" render={<Link to="/jobs" />} nativeButton={false} size="sm" variant="ghost">
          <ArrowLeftIcon /> Jobs <kbd className="ml-1 font-mono text-[10px] text-muted-foreground">Esc</kbd>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <DeadlineBadge deadline={job.deadline} source={job.deadline_source} />
              <FreshnessBadge job={job} />
              <span className="text-muted-foreground text-xs">{postedLabel(job)}</span>
              <span className={cn("rounded-md px-1.5 py-0.5 text-[11px]", applied ? "bg-emerald-600/10 text-emerald-800 dark:text-emerald-300" : "bg-muted")}>{STATUS_LABEL[job.status]}</span>
              <SponsorBadge status={c?.sponsor_status} />
            </div>
            <h1 className="text-balance font-heading text-4xl leading-none tracking-tight md:text-5xl">{job.title}</h1>
            <p className="mt-2 text-sm">
              {job.company_name}
              <span className="text-muted-foreground">
                {" "}
                · {job.location ?? job.city ?? "Location not stated"} · {remoteLabel(job.remote_type)}
                {job.salary_text && ` · ${job.salary_text}`}
              </span>
            </p>
            {links.length > 0 && (
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-muted-foreground">Found on</span>
                {links.map((l) => (
                  <a className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground" href={l.url} key={l.url} rel="noreferrer" target="_blank">
                    {l.label}
                    <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
                    <span className="sr-only">(opens the job post in a new tab)</span>
                  </a>
                ))}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {applyUrl && (
              <Button render={<a href={applyUrl} rel="noreferrer" target="_blank" />} nativeButton={false}>
                Apply on site <ExternalLinkIcon />
              </Button>
            )}
            {applied ? (
              <div className="flex items-center gap-1" role="status">
                <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-emerald-600/30 bg-emerald-600/10 px-3 font-medium text-emerald-800 text-sm dark:text-emerald-300">
                  <CheckCircle2Icon className="size-4" />
                  {job.status === "applied" ? "Applied" : `Applied, now ${STATUS_LABEL[job.status]}`}
                  <span className="font-normal text-xs opacity-80">{new Date(job.status_changed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </span>
                {job.status === "applied" && (
                  <Button onClick={() => void setStatus(job.id, "shortlisted")} size="sm" variant="ghost">
                    <Undo2Icon /> Unmark
                  </Button>
                )}
              </div>
            ) : job.status === "skipped" ? (
              <div className="flex items-center gap-1" role="status">
                <span className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-muted px-3 text-muted-foreground text-sm">
                  <XIcon className="size-4" /> Skipped
                </span>
                <Button onClick={() => void setStatus(job.id, "found")} size="sm" variant="ghost">
                  <Undo2Icon /> Undo
                </Button>
              </div>
            ) : (
              <>
                <Button onClick={() => void setStatus(job.id, "applied")} variant="outline">
                  <CheckIcon /> Mark applied <kbd className="font-mono text-[10px] text-muted-foreground">A</kbd>
                </Button>
                <Button onClick={() => void setStatus(job.id, "skipped")} variant="ghost">
                  <XIcon /> Skip
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border p-px lg:grid-cols-5">
        <DashboardCard className="gap-0 lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="font-heading text-xl font-normal">CV fit</CardTitle>
            <CardDescription>
              {s ? "Scored against your master CV. Only lines from your experience bank are suggested." : "Not scored yet. Job Scout scores new jobs on its next run."}
            </CardDescription>
          </CardHeader>
          {s && (
            <CardContent className="flex flex-col gap-6 pt-6">
              <div className="grid grid-cols-3 items-end gap-4 sm:flex sm:flex-wrap sm:gap-8">
                <div>
                  <p className="font-mono text-[11px] text-muted-foreground uppercase">Now</p>
                  <p className="font-mono font-semibold text-4xl tabular-nums sm:text-5xl">{s.score_now}</p>
                </div>
                <div>
                  <p className="font-mono text-[11px] text-muted-foreground uppercase">After your ticks</p>
                  <p aria-live="polite" className="font-mono font-semibold text-4xl text-sky-700 tabular-nums sm:text-5xl dark:text-sky-400">{after}</p>
                </div>
                <div>
                  <p className="font-mono text-[11px] text-muted-foreground uppercase">Best honest score</p>
                  <p className="font-mono text-4xl text-muted-foreground tabular-nums sm:text-5xl">{s.score_possible}</p>
                </div>
                {s.verdict && (
                  <div className="col-span-3 border-t pt-3 sm:col-span-1 sm:ml-auto sm:max-w-xs sm:border-0 sm:pt-0 sm:text-right">
                    <p className="font-heading text-xl">{verdictText[s.verdict]}</p>
                    {s.verdict_reason && <p className="text-muted-foreground text-xs">{s.verdict_reason}</p>}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                Scores are out of 100.{" "}
                {(after ?? s.score_now) < s.score_possible
                  ? `Tick the true lines below to move from ${after ?? s.score_now} toward ${s.score_possible}.`
                  : "This is the best honest score for this job."}
              </p>
              {s.score_possible < 90 && (
                <p className="rounded-md bg-muted px-3 py-2 text-xs">
                  90+ isn't possible honestly for this job. The best true score is {s.score_possible}.
                </p>
              )}

              <ul className="space-y-2">
                {PARTS.map(({ key, label }) => {
                  const p: ScorePart | undefined = s.breakdown[key];
                  if (!p) return null;
                  return (
                    <li className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-xs" key={key}>
                      <span>{label}</span>
                      <span className="font-mono tabular-nums">
                        {p.got}/{p.max}
                      </span>
                      <div aria-hidden="true" className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-foreground/70" style={{ width: `${(p.got / p.max) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <section>
                <h2 className="mb-1 flex items-center gap-2 font-medium text-sm">
                  <span aria-hidden="true" className="size-2 rounded-full bg-emerald-600" />
                  You have this, the CV doesn't say it
                </h2>
                <p className="mb-3 text-muted-foreground text-xs">Tick the lines that are true and you want in the CV for this job.</p>
                {s.green_items.length === 0 ? (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm">
                    Nothing to add for this job. Your master CV already covers what it asks for, so apply with your master CV as it is.
                  </p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {s.green_items.map((g) => {
                      const on = s.ticked_items.includes(g.id);
                      return (
                        <li key={g.id}>
                          <label className={cn("flex cursor-pointer items-start gap-3 p-3", on && "bg-emerald-600/5")}>
                            <Checkbox
                              aria-label={`Add ${g.keyword} line to the CV for this job`}
                              checked={on}
                              className="mt-0.5 size-5 border-2 border-foreground/50"
                              onCheckedChange={() => void toggleTick(job.id, g.id)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm">{g.keyword}</span>
                                <span className="font-mono text-emerald-700 text-xs dark:text-emerald-400">+{g.points}</span>
                              </span>
                              <span className="mt-0.5 block text-muted-foreground text-sm">{g.line}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {s.green_items.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    disabled={ticked.length === 0 || tailorPending}
                    onClick={() => void sendRequest("tailor_cv", { job_id: job.id, items: s.ticked_items })}
                    size="sm"
                  >
                    <FileTextIcon /> {tailorPending ? "Requested" : tailorRequest ? "Make it again" : "Make tailored CV"}
                  </Button>
                  <Button disabled={ticked.length === 0} onClick={() => void copyLines()} size="sm" variant="outline">
                    <CopyIcon /> Copy lines for Overleaf
                  </Button>
                </div>
                )}
                <div aria-live="polite" className="mt-2 text-xs">
                  {s.green_items.length > 0 && ticked.length === 0 && !tailorRequest && !s.tailored_cv_path && (
                    <p className="font-medium text-amber-800 dark:text-amber-300">Tick the box next to at least one line above. The two buttons switch on once a line is ticked.</p>
                  )}
                  {tailorPending && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <ClockIcon className="size-3.5" /> Requested {timeAgo(tailorRequest.created_at)}. The bot makes it on its next check and the file
                      appears here.
                    </p>
                  )}
                  {tailorRequest?.status === "error" && (
                    <p className="text-destructive">
                      The bot couldn't make it: {String(tailorRequest.result?.message ?? "no reason given")}. Click Make it again to retry.
                    </p>
                  )}
                  {s.tailored_cv_path && !tailorPending && (
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2Icon className="size-3.5 text-emerald-600" /> Ready: <span className="font-mono">{s.tailored_cv_path}</span>
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="mb-1 flex items-center gap-2 font-medium text-sm">
                  <span aria-hidden="true" className="size-2 rounded-full bg-destructive" />
                  You don't have this
                </h2>
                <p className="mb-3 text-muted-foreground text-xs">Listed so you know. Never added to the CV.</p>
                {s.red_items.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No gaps found.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {s.red_items.map((r) => (
                      <li className="rounded-md border border-destructive/20 px-2 py-1 text-xs" key={r.keyword} title={r.note}>
                        {r.keyword}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {s.keywords.length > 0 && (
                <section>
                  <h2 className="mb-2 font-medium text-sm">Top keywords in this job</h2>
                  <ul className="flex flex-wrap gap-2">
                    {s.keywords.map((k) => (
                      <li
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                          k.present ? "border-emerald-600/30" : "border-dashed text-muted-foreground",
                        )}
                        key={k.keyword}
                      >
                        {k.present ? <CheckIcon className="size-3" /> : <XIcon className="size-3" />}
                        {k.keyword}
                        <span className="sr-only">{k.present ? "(in your CV)" : "(missing)"}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </CardContent>
          )}
        </DashboardCard>

        <div className="flex flex-col gap-px lg:col-span-2">
          <DashboardCard className="gap-0">
            <CardHeader className="border-b">
              <CardTitle className="font-heading text-xl font-normal">{job.company_name}</CardTitle>
              <CardDescription>{c?.about ?? "Company details arrive with Contact Finder (Bot 2)."}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {[
                  ["Industry", c?.industry],
                  ["Size", c?.size_label],
                  ["Funding", c?.funding_stage],
                  ["Investors", c?.investors],
                  ["HQ", c?.hq],
                  ["India offices", c?.india_offices],
                  ["Designers found", c?.design_team_count?.toString()],
                ].map(([k, v]) => (
                  <div className="contents" key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className={cn(!v && "text-muted-foreground")}>{v ?? "Not found"}</dd>
                  </div>
                ))}
              </dl>
              {c?.sponsor_status && c.sponsor_status !== "not_applicable" && (
                <p className="mt-3 text-xs">
                  <SponsorBadge status={c.sponsor_status} />{" "}
                  <span className="text-muted-foreground">{c.sponsor_source ?? "Source not recorded"}</span>
                </p>
              )}
              {c?.why_fit && (
                <p className="mt-4 border-l-2 pl-3 font-heading text-lg leading-snug">{c.why_fit}</p>
              )}
              {c?.news?.length ? (
                <div className="mt-4">
                  <p className="mb-1 font-mono text-[11px] text-muted-foreground uppercase">Recent news</p>
                  <ul className="space-y-1 text-sm">
                    {c.news.slice(0, 3).map((n) => (
                      <li key={n.title}>
                        {n.url ? (
                          <a className="underline-offset-4 hover:underline" href={n.url} rel="noreferrer" target="_blank">
                            {n.title}
                          </a>
                        ) : (
                          n.title
                        )}
                        {n.date && <span className="text-muted-foreground text-xs"> · {n.date}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {c?.website && (
                  <a className="underline-offset-4 hover:underline" href={c.website} rel="noreferrer" target="_blank">
                    Website
                  </a>
                )}
                {c?.careers_url && (
                  <a className="underline-offset-4 hover:underline" href={c.careers_url} rel="noreferrer" target="_blank">
                    Careers page
                  </a>
                )}
              </div>
            </CardContent>
          </DashboardCard>

          <DashboardCard className="gap-0">
            <CardHeader className="border-b">
              <CardTitle className="font-heading text-xl font-normal">Contacts</CardTitle>
              <CardDescription>Hiring managers and peers, with verified emails and LinkedIn notes.</CardDescription>
            </CardHeader>
            <CardContent className="py-6 text-center text-muted-foreground text-sm">Arrives with Contact Finder (Bot 2).</CardContent>
          </DashboardCard>

          <DashboardCard className="flex-1 gap-0">
            <CardHeader className="border-b">
              <CardTitle className="font-heading text-xl font-normal">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {events.length === 0 ? (
                <p className="px-6 py-4 text-muted-foreground text-sm">Nothing yet.</p>
              ) : (
                <ol className="divide-y">
                  {events.map((e) => (
                    <li className="flex items-center justify-between gap-3 px-6 py-2.5 text-sm" key={e.id}>
                      <span>{e.detail ?? e.kind}</span>
                      <span className="shrink-0 text-muted-foreground text-xs">{timeAgo(e.created_at)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </DashboardCard>
        </div>
      </div>

      <DashboardCard className="gap-0 border">
        <CardHeader className="border-b">
          <CardTitle className="font-heading text-xl font-normal">Job description</CardTitle>
          <CardDescription>
            Sources: {job.sources.join(", ") || "Not recorded"}
            {job.urls.length > 1 && ` (${job.urls.length} links)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {job.description ? (
            <>
              <p className={cn("whitespace-pre-line text-sm leading-relaxed", !showDesc && "line-clamp-6")}>{job.description}</p>
              <Button className="mt-2 px-0" onClick={() => setShowDesc((v) => !v)} size="sm" variant="link">
                {showDesc ? "Show less" : "Show the full description"}
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No description saved.</p>
          )}
          {job.urls.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs">
              {job.urls.map((u) => (
                <li key={u}>
                  <a className="break-all text-muted-foreground underline-offset-4 hover:underline" href={u} rel="noreferrer" target="_blank">
                    {u}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </DashboardCard>
    </div>
  );
}
