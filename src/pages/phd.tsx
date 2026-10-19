import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, CopyIcon, ExternalLinkIcon, GraduationCapIcon, MailIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { DashboardCard } from "@/components/dashboard-card";
import { DeadlineBadge } from "@/components/job-bits";
import { PageTitle } from "@/components/page-title";
import { supabase } from "@/lib/supabase";
import { useData } from "@/lib/data";
import { demoPhds } from "@/lib/demo";
import { PHD_STATUSES, PHD_STATUS_LABEL, type PhdEligibility, type PhdPosition, type PhdStatus, type ProposalSection } from "@/lib/types";
import { useHotkeys } from "@/hooks/use-hotkeys";

const eligibilityText: Record<PhdEligibility, string> = {
  eligible: "You can apply",
  check: "Check eligibility",
  not_eligible: "Funding not open to you",
};

function EligibilityBadge({ status }: { status: PhdEligibility }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-1.5 py-0.5 text-[11px]",
        status === "eligible" && "border-emerald-600/30 text-emerald-700 dark:text-emerald-400",
        status === "check" && "border-dashed text-muted-foreground",
        status === "not_eligible" && "border-destructive/30 text-destructive",
      )}
    >
      {eligibilityText[status]}
    </span>
  );
}

const proposalText = (p: PhdPosition) => p.proposal.map((s) => `${s.heading}\n\n${s.body}`).join("\n\n");
const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

/** Loads phd_positions and keeps them live. Demo mode uses fictional rows. */
function usePhds() {
  const { demo } = useData();
  const [rows, setRows] = useState<PhdPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (demo) {
      setRows(demoPhds());
      setLoading(false);
      return;
    }
    const { data, error: e } = await supabase.from("phd_positions").select("*").order("deadline", { ascending: true, nullsFirst: false });
    if (e) setError(e.message);
    else {
      setError(null);
      setRows((data ?? []) as PhdPosition[]);
    }
    setLoading(false);
  }, [demo]);

  useEffect(() => {
    void reload();
    if (demo) return;
    const channel = supabase
      .channel("phd")
      .on("postgres_changes", { event: "*", schema: "public", table: "phd_positions" }, () => void reload())
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [demo, reload]);

  const update = useCallback(
    async (id: string, patch: Partial<PhdPosition>, okMessage?: string) => {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      if (demo) return;
      const { error: e } = await supabase.from("phd_positions").update(patch).eq("id", id);
      if (e) toast.error(`Couldn't save: ${e.message}`, { description: "Your change is still on screen. Try again." });
      else if (okMessage) toast.success(okMessage);
    },
    [demo],
  );

  return { rows, loading, error, update, reload };
}

export function PhdPage() {
  const { rows, loading, error, reload } = usePhds();
  const open = rows.filter((r) => !["rejected", "skipped"].includes(r.status));
  const closed = rows.filter((r) => ["rejected", "skipped"].includes(r.status));

  if (error) {
    const missing = /phd_positions/.test(error) && /(does not exist|schema cache|not find)/i.test(error);
    return (
      <div>
        <PageTitle title="PhD" />
        <div className="rounded-md border border-destructive/30 p-4 text-sm" role="alert">
          {missing ? (
            <>The PhD table isn't in the database yet. Run <code className="font-mono">dashboard/supabase/phd.sql</code> once in the Supabase SQL editor, then reload.</>
          ) : (
            <>Couldn't load PhD positions: {error}</>
          )}
          <Button className="ml-3" onClick={() => void reload()} size="sm" variant="outline">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        description="Funded PhD positions, whether you can get the funding, and a draft proposal for each so you can apply to several without starting from a blank page."
        title="PhD"
      />
      {loading ? (
        <p aria-busy="true" className="text-muted-foreground text-sm">
          Loading PhD positions...
        </p>
      ) : rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GraduationCapIcon />
            </EmptyMedia>
            <EmptyTitle>No PhD positions yet</EmptyTitle>
            <EmptyDescription>Send Claude a PhD post and it will add the position here with a draft proposal.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-8">
          <ul className="grid gap-px bg-border p-px md:grid-cols-2 xl:grid-cols-3">
            {open.map((p) => (
              <PhdCard key={p.id} p={p} />
            ))}
          </ul>
          {closed.length > 0 && (
            <section>
              <h2 className="mb-2 font-heading text-xl">Skipped or closed</h2>
              <ul className="grid gap-px bg-border p-px md:grid-cols-2 xl:grid-cols-3">
                {closed.map((p) => (
                  <PhdCard key={p.id} p={p} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PhdCard({ p }: { p: PhdPosition }) {
  const words = wordCount(proposalText(p));
  const done = p.checklist.filter((c) => c.done).length;
  return (
    <li className="bg-background">
      <Link className="flex h-full flex-col gap-3 p-5 outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50" to={`/phd/${p.id}`}>
        <div className="flex flex-wrap items-center gap-2">
          <DeadlineBadge deadline={p.deadline} />
          <EligibilityBadge status={p.eligibility_status} />
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px]">{PHD_STATUS_LABEL[p.status]}</span>
        </div>
        <div>
          <h3 className="text-balance font-heading text-xl leading-tight">{p.title}</h3>
          <p className="mt-1 text-sm">
            {p.university}
            <span className="text-muted-foreground">{p.city ? ` · ${p.city}` : ""}{p.country ? `, ${p.country}` : ""}</span>
          </p>
        </div>
        {p.fit_reason && <p className="line-clamp-3 text-muted-foreground text-sm">{p.fit_reason}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          {p.start_date ? <span className="text-muted-foreground text-xs">Starts {p.start_date}</span> : <span />}
          <span className="font-mono text-[11px] text-muted-foreground">
            {words} words · {done}/{p.checklist.length} ready
          </span>
        </div>
      </Link>
    </li>
  );
}

export function PhdDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rows, loading, update } = usePhds();
  const p = rows.find((r) => r.id === id);
  useHotkeys({ Escape: () => navigate("/phd") }, true);

  if (!p) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground text-sm">
        {loading ? "Loading the position..." : "This PhD position wasn't found."}{" "}
        <Link className="underline" to="/phd">
          Back to PhD
        </Link>
      </div>
    );
  }

  const text = proposalText(p);
  const copy = async (value: string, what: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Copied ${what}.`);
    } catch {
      toast.error("Couldn't copy. Select the text by hand instead.");
    }
  };

  const saveSection = (index: number, body: string) => {
    if (p.proposal[index].body === body) return;
    const proposal: ProposalSection[] = p.proposal.map((s, i) => (i === index ? { ...s, body } : s));
    void update(p.id, { proposal, status: p.status === "to_apply" ? "drafting" : p.status }, "Proposal saved.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button className="-ml-2 mb-3" nativeButton={false} render={<Link to="/phd" />} size="sm" variant="ghost">
          <ArrowLeftIcon /> PhD <kbd className="ml-1 font-mono text-[10px] text-muted-foreground">Esc</kbd>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <DeadlineBadge deadline={p.deadline} />
              <EligibilityBadge status={p.eligibility_status} />
              {!p.deadline && <span className="text-muted-foreground text-xs">No deadline stated</span>}
            </div>
            <h1 className="text-balance font-heading text-4xl leading-none tracking-tight md:text-5xl">{p.title}</h1>
            <p className="mt-2 text-sm">
              {p.university}
              <span className="text-muted-foreground">
                {p.group_name ? ` · ${p.group_name}` : ""}
                {p.supervisor ? ` · Supervisor ${p.supervisor}` : ""}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {p.url && (
              <Button nativeButton={false} render={<a href={p.url} rel="noreferrer" target="_blank" />}>
                Open the advert <ExternalLinkIcon />
              </Button>
            )}
            <label className="sr-only" htmlFor="phd-status">
              Status
            </label>
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              id="phd-status"
              onChange={(e) => void update(p.id, { status: e.target.value as PhdStatus }, `Marked ${PHD_STATUS_LABEL[e.target.value as PhdStatus]}.`)}
              value={p.status}
            >
              {PHD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PHD_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border p-px lg:grid-cols-5">
        <DashboardCard className="gap-0 lg:col-span-3">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-xl font-normal">Draft proposal</CardTitle>
                <CardDescription>
                  {wordCount(text)} words{p.proposal_limit ? ` · limit: ${p.proposal_limit}` : ""}. Edit any part, it saves when you click away. Lines in [square brackets] need your input.
                </CardDescription>
              </div>
              <Button onClick={() => void copy(text, "the whole proposal")} size="sm" variant="outline">
                <CopyIcon /> Copy all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pt-6">
            {p.proposal.map((s, i) => (
              <ProposalBlock key={`${p.id}-${i}-${s.heading}`} onCopy={() => void copy(s.body, `"${s.heading}"`)} onSave={(b) => saveSection(i, b)} section={s} />
            ))}
          </CardContent>
        </DashboardCard>

        <div className="flex flex-col gap-px lg:col-span-2">
          <DashboardCard className="gap-0">
            <CardHeader className="border-b">
              <CardTitle className="font-heading text-xl font-normal">Can you apply?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              {p.eligibility && <p>{p.eligibility}</p>}
              {p.funding && (
                <p>
                  <span className="text-muted-foreground">Funding: </span>
                  {p.funding}
                </p>
              )}
              {p.start_date && (
                <p>
                  <span className="text-muted-foreground">Starts: </span>
                  {p.start_date}
                </p>
              )}
            </CardContent>
          </DashboardCard>

          <DashboardCard className="gap-0">
            <CardHeader className="border-b">
              <CardTitle className="font-heading text-xl font-normal">Why it fits you</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              {p.fit_reason && <p>{p.fit_reason}</p>}
              {p.gaps.length > 0 && (
                <div>
                  <p className="mb-1 font-medium">Gaps to be honest about</p>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {p.gaps.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </DashboardCard>

          <DashboardCard className="gap-0">
            <CardHeader className="border-b">
              <CardTitle className="font-heading text-xl font-normal">What to send</CardTitle>
              <CardDescription>Tick each one as you get it ready.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                {p.checklist.map((c, i) => (
                  <li key={c.item}>
                    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                      <Checkbox
                        checked={c.done}
                        className="mt-0.5"
                        onCheckedChange={(v) =>
                          void update(p.id, { checklist: p.checklist.map((x, j) => (j === i ? { ...x, done: Boolean(v) } : x)) })
                        }
                      />
                      <span className={cn(c.done && "text-muted-foreground line-through")}>{c.item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </CardContent>
          </DashboardCard>

          {(p.contact_email || p.post_url) && (
            <DashboardCard className="gap-0">
              <CardHeader className="border-b">
                <CardTitle className="font-heading text-xl font-normal">Contact</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-2 pt-4 text-sm">
                {p.contact_email && (
                  <a className="inline-flex items-center gap-1.5 underline underline-offset-4" href={`mailto:${p.contact_email}`}>
                    <MailIcon className="size-4" /> {p.contact_email}
                  </a>
                )}
                {p.post_url && (
                  <a className="inline-flex items-center gap-1.5 underline underline-offset-4" href={p.post_url} rel="noreferrer" target="_blank">
                    The LinkedIn post <ExternalLinkIcon className="size-3.5" />
                  </a>
                )}
              </CardContent>
            </DashboardCard>
          )}

          {p.notes && (
            <DashboardCard className="gap-0">
              <CardHeader className="border-b">
                <CardTitle className="font-heading text-xl font-normal">Notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-line pt-4 text-sm">{p.notes}</CardContent>
            </DashboardCard>
          )}
        </div>
      </div>
    </div>
  );
}

function ProposalBlock({ section, onSave, onCopy }: { section: ProposalSection; onSave: (body: string) => void; onCopy: () => void }) {
  const [value, setValue] = useState(section.body);
  useEffect(() => setValue(section.body), [section.body]);
  const id = `sec-${section.heading.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="font-heading text-lg" htmlFor={id}>
          {section.heading}
        </label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">{wordCount(value)} words</span>
          <Button aria-label={`Copy ${section.heading}`} onClick={onCopy} size="icon-sm" variant="ghost">
            <CopyIcon />
          </Button>
        </div>
      </div>
      <Textarea className="leading-relaxed" id={id} onBlur={() => onSave(value)} onChange={(e) => setValue(e.target.value)} value={value} />
    </section>
  );
}
