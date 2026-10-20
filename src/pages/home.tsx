import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, BriefcaseIcon, GraduationCapIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/data";
import { freshnessOf, greeting } from "@/lib/format";
import { APPLIED_STATUSES } from "@/lib/types";
import { usePhds } from "@/pages/phd";

function Choice({
  to,
  icon,
  kicker,
  title,
  blurb,
  stats,
  className,
}: {
  to: string;
  icon: ReactNode;
  kicker: string;
  title: string;
  blurb: string;
  stats: { label: string; value: number | string }[];
  className?: string;
}) {
  return (
    <Link
      className={cn(
        "group relative flex min-h-72 flex-col justify-between gap-8 overflow-hidden rounded-2xl border bg-background p-7 outline-none transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-foreground/30 hover:shadow-[0_18px_40px_-20px_rgb(0_0_0/0.35)] focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:p-9",
        className,
      )}
      to={to}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl border bg-muted/50 transition-colors duration-300 group-hover:bg-foreground group-hover:text-background [&_svg]:size-5">
          {icon}
        </span>
        <span className="flex size-10 items-center justify-center rounded-full border transition-all duration-300 group-hover:translate-x-1 group-hover:bg-foreground group-hover:text-background motion-reduce:group-hover:translate-x-0">
          <ArrowRightIcon className="size-4" />
        </span>
      </div>
      <div>
        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">{kicker}</p>
        <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight md:text-5xl">{title}</h2>
        <p className="mt-3 max-w-sm text-muted-foreground text-sm leading-relaxed">{blurb}</p>
      </div>
      <dl className="grid grid-cols-3 gap-4 border-t pt-5">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-muted-foreground text-xs">{s.label}</dt>
            <dd className="mt-1 font-mono font-semibold text-2xl tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </Link>
  );
}

export function HomePage() {
  const { jobs, contacts, loading } = useData();
  const { rows: phds, loading: phdLoading } = usePhds();

  const toReview = jobs.filter((j) => (j.status === "found" || j.status === "shortlisted") && freshnessOf(j) !== "old").length;
  const applied = jobs.filter((j) => APPLIED_STATUSES.includes(j.status)).length;
  const toSend = contacts.filter(
    (c) =>
      (c.linkedin_note && c.linkedin_status === "not_sent") ||
      (c.email && (c.email_status === "verified" || c.email_status === "accept_all") && !c.last_contacted_at),
  ).length;

  const openPhds = phds.filter((p) => !["applied", "rejected", "skipped", "offer"].includes(p.status));
  const nextDeadline = openPhds
    .map((p) => p.deadline)
    .filter((d): d is string => Boolean(d) && new Date(d!).getTime() >= Date.now() - 864e5)
    .sort()[0];
  const dash = (v: number) => (loading ? "…" : v);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-2 md:py-8">
      <div>
        <p className="font-mono text-[11px] text-muted-foreground uppercase">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-1 font-heading text-5xl leading-none tracking-tight md:text-6xl">{greeting()}, Jai.</h1>
        <p className="mt-3 text-muted-foreground">What are you working on today?</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Choice
          blurb="New roles scored against your CV, the ones you've applied to, and who to contact for each."
          icon={<BriefcaseIcon />}
          kicker="Job search"
          stats={[
            { label: "To review", value: dash(toReview) },
            { label: "Applied", value: dash(applied) },
            { label: "To send", value: dash(toSend) },
          ]}
          title="Apply for jobs"
          to="/today"
        />
        <Choice
          blurb="Funded PhD positions, whether you're eligible, and your draft proposal for each."
          icon={<GraduationCapIcon />}
          kicker="Research"
          stats={[
            { label: "Positions", value: phdLoading ? "…" : phds.length },
            { label: "Open", value: phdLoading ? "…" : openPhds.length },
            {
              label: "Next deadline",
              value: phdLoading ? "…" : nextDeadline ? new Date(nextDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "None",
            },
          ]}
          title="PhD applications"
          to="/phd"
        />
      </div>

      {toSend > 0 && (
        <Link
          className="group flex items-center gap-3 rounded-xl border border-dashed px-5 py-4 text-sm transition-colors hover:border-foreground/40 hover:bg-muted/40"
          to="/contacts"
        >
          <UsersIcon className="size-4 text-muted-foreground" />
          <span className="flex-1">
            {toSend} {toSend === 1 ? "person is" : "people are"} waiting for an email or LinkedIn note from you.
          </span>
          <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0" />
        </Link>
      )}
    </div>
  );
}
