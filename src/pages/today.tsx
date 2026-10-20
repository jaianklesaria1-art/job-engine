import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BotIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  UserPlusIcon,
  MailCheckIcon,
  MessageSquareReplyIcon,
  SendIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/components/dashboard-card";
import { JobCard } from "@/components/job-card";
import { GettingStarted } from "@/components/getting-started";
import { useData, useLastRuns } from "@/lib/data";
import { freshnessOf, timeAgo } from "@/lib/format";
import { BOT_LABEL, type BotName } from "@/lib/types";

const replyLabel = {
  positive: "Positive",
  referral: "Referral offered",
  not_hiring: "Not hiring",
  not_interested: "Not interested",
  out_of_office: "Out of office",
  bounce: "Bounced",
  other: "Other",
};

export function TodayPage() {
  const { jobs, batches, replies, linkedinToSend, settings, loading, error, demo } = useData();
  const lastRuns = useLastRuns();
  const threshold = settings?.score_threshold ?? 75;

  const fresh = useMemo(() => jobs.filter((j) => j.status === "found" && freshnessOf(j) !== "old"), [jobs]);
  const counts = {
    hot: fresh.filter((j) => freshnessOf(j) === "hot").length,
    fresh: fresh.filter((j) => freshnessOf(j) === "fresh").length,
    ok: fresh.filter((j) => freshnessOf(j) === "ok").length,
  };
  const hotJobs = fresh
    .filter((j) => freshnessOf(j) === "hot" && (j.score?.score_now ?? 0) >= threshold)
    .sort((a, b) => (b.score?.score_now ?? 0) - (a.score?.score_now ?? 0))
    .slice(0, 6);
  const pending = batches.filter((b) => b.status === "pending");
  const unseen = replies.filter((r) => !r.seen);
  const shortlisted = jobs.filter((j) => j.status === "shortlisted");

  const tasks = [
    ...pending.map((b) => ({
      key: `b${b.id}`,
      icon: <MailCheckIcon />,
      text: `Approve 1 email batch (${b.email_count} emails)`,
      to: "/outreach",
    })),
    ...(linkedinToSend
      ? [{ key: "li", icon: <UserPlusIcon />, text: `Send ${linkedinToSend} LinkedIn ${linkedinToSend === 1 ? "note" : "notes"}`, to: "/contacts" }]
      : []),
    ...unseen
      .filter((r) => r.type === "positive" || r.type === "referral")
      .map((r) => ({
        key: `r${r.id}`,
        icon: <MessageSquareReplyIcon />,
        text: `Reply to ${r.contact_name ?? "a contact"}${r.company_name ? ` at ${r.company_name}` : ""} (${replyLabel[r.type].toLowerCase()})`,
        to: "/outreach",
      })),
    ...shortlisted.slice(0, 3).map((j) => ({
      key: `s${j.id}`,
      icon: <SendIcon />,
      text: `Apply: ${j.title} at ${j.company_name}`,
      to: `/jobs/${j.id}`,
    })),
  ].slice(0, 10);

  const stats = [
    { label: "New jobs", value: counts.hot + counts.fresh + counts.ok, foot: `${counts.hot} hot · ${counts.fresh} fresh · ${counts.ok} recent`, to: "/jobs" },
    { label: "To approve", value: pending.length, foot: pending.length ? `${pending.reduce((s, b) => s + b.email_count, 0)} emails waiting` : "Nothing waiting", to: "/outreach" },
    { label: "LinkedIn notes to send", value: linkedinToSend, foot: "You send these by hand", to: "/contacts" },
    { label: "Replies", value: unseen.length, foot: "New since you last looked", to: "/outreach" },
  ];

  const bots: BotName[] = ["job_scout", "contact_finder", "outreach", "inbox_tracker"];
  const failed = bots.filter((b) => lastRuns.get(b)?.status === "error");
  const scout = lastRuns.get("job_scout");
  const firstRun = !demo && !loading && !error && jobs.length === 0 && !scout;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] text-muted-foreground uppercase">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 font-heading text-4xl leading-none tracking-tight md:text-5xl">Today's job search</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {firstRun
              ? "Welcome. Your job search starts here."
              : tasks.length
                ? `${tasks.length} ${tasks.length === 1 ? "thing needs" : "things need"} you today.`
                : "Nothing needs you right now."}
          </p>
        </div>
        <Button render={<Link to="/jobs" />} nativeButton={false} variant="outline">
          All jobs <ArrowRightIcon />
        </Button>
      </div>

      {failed.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm" role="alert">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span>
            {failed.map((b) => BOT_LABEL[b]).join(", ")} failed on the last run. See Bot health below.
          </span>
        </div>
      )}

      {firstRun ? (
        <GettingStarted />
      ) : (
        <>
      <div className="grid grid-cols-2 gap-px bg-border p-px lg:grid-cols-4">
        {stats.map((s) => (
          <DashboardCard className="relative" key={s.label}>
            <CardHeader>
              <CardTitle className="font-normal text-xs tracking-wide">
                <Link className="after:absolute after:inset-0" to={s.to}>
                  {s.label}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-12" /> : <p className="font-mono font-semibold text-3xl tabular-nums">{s.value}</p>}
            </CardContent>
            <CardFooter className="rounded-none bg-background text-muted-foreground text-xs">{s.foot}</CardFooter>
          </DashboardCard>
        ))}

        <DashboardCard className="col-span-2 gap-0">
          <CardHeader className="border-b">
            <CardTitle className="font-heading text-xl font-normal">Do now</CardTitle>
            <CardDescription>Most urgent first. Each one takes you straight to the action.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {tasks.length === 0 ? (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CircleCheckIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>You're caught up.</EmptyTitle>
                  <EmptyDescription className="text-xs">New tasks appear here after the bots run.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y">
                {tasks.map((t) => (
                  <li key={t.key}>
                    <Link className="flex h-14 items-center gap-3 px-6 text-sm hover:bg-muted/50 [&_svg]:size-4 [&_svg]:text-muted-foreground" to={t.to}>
                      {t.icon}
                      <span className="flex-1 truncate">{t.text}</span>
                      <ArrowRightIcon />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 gap-0">
          <CardHeader className="border-b">
            <CardTitle className="font-heading text-xl font-normal">Replies</CardTitle>
            <CardDescription>Bot 4 sorts each reply. You answer in Gmail.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {replies.length === 0 ? (
              <p className="px-6 py-10 text-center text-muted-foreground text-sm">No replies yet. They show up here within 2 hours.</p>
            ) : (
              <ul className="divide-y">
                {replies.slice(0, 5).map((r) => (
                  <li className="flex items-start gap-3 px-6 py-3" key={r.id}>
                    <span
                      className={
                        r.type === "positive" || r.type === "referral"
                          ? "mt-0.5 rounded-md bg-emerald-600/10 px-1.5 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-400"
                          : "mt-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                      }
                    >
                      {replyLabel[r.type]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {r.contact_name ?? "Contact"}
                        {r.company_name && <span className="text-muted-foreground"> · {r.company_name}</span>}
                      </p>
                      {r.summary && <p className="line-clamp-2 text-muted-foreground text-xs">{r.summary}</p>}
                    </div>
                    <span className="shrink-0 text-muted-foreground text-xs">{timeAgo(r.received_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </DashboardCard>
      </div>

      <section aria-labelledby="hot-jobs">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl" id="hot-jobs">
              Hot jobs
            </h2>
            <p className="text-muted-foreground text-xs">Posted in the last 24 hours, scoring {threshold}+.</p>
          </div>
          <Link className="text-sm underline-offset-4 hover:underline" to="/jobs">
            See all
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-px bg-border p-px md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div className="bg-background p-4" key={i}>
                <Skeleton className="mb-3 h-4 w-24" />
                <Skeleton className="mb-2 h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : hotJobs.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground text-sm">
            No hot jobs scoring {threshold}+ yet.{" "}
            {scout ? `Job Scout last ran ${timeAgo(scout.started_at)}.` : "Job Scout hasn't run yet. Hot jobs show here after its first run."}
          </div>
        ) : (
          <div className="grid gap-px bg-border p-px md:grid-cols-2 lg:grid-cols-3">
            {hotJobs.map((j) => (
              <JobCard job={j} key={j.id} />
            ))}
          </div>
        )}
      </section>
        </>
      )}

      <details className="group rounded-md border" open={failed.length > 0}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm">
          <BotIcon className="size-4 text-muted-foreground" />
          <span className="font-medium">Bot health</span>
          <span className="text-muted-foreground text-xs">
            {failed.length ? `${failed.length} failed` : "All good"}
          </span>
          <span className="ml-auto text-muted-foreground text-xs group-open:hidden">Show</span>
        </summary>
        <div className="grid gap-px border-t bg-border sm:grid-cols-2 lg:grid-cols-4">
          {bots.map((b) => {
            const r = lastRuns.get(b);
            return (
              <div className="bg-background p-4" key={b}>
                <p className="text-sm">{BOT_LABEL[b]}</p>
                <p className="mt-1 font-mono text-xs">
                  {!r ? (
                    <span className="text-muted-foreground">Not run yet</span>
                  ) : r.status === "error" ? (
                    <span className="text-destructive">Failed {timeAgo(r.started_at)}</span>
                  ) : r.status === "running" ? (
                    <span>Running now</span>
                  ) : (
                    <span className="text-emerald-700 dark:text-emerald-400">OK · {timeAgo(r.started_at)}</span>
                  )}
                </p>
                {r?.credits.firecrawl_left != null && (
                  <p className="mt-1 text-muted-foreground text-xs">Firecrawl: {r.credits.firecrawl_left} credits left</p>
                )}
                {r?.credits.hunter_used != null && (
                  <p className="mt-1 text-muted-foreground text-xs">
                    Hunter: {r.credits.hunter_used} of {r.credits.hunter_limit} searches used
                  </p>
                )}
                {r?.errors?.length ? <p className="mt-1 text-destructive text-xs">{r.errors[0]}</p> : null}
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
