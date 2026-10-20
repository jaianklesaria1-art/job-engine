import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { demoData } from "@/lib/demo";
import { STATUS_LABEL, type Batch, type Contact, type Job, type JobEvent, type JobScore, type JobStatus, type BotRequest, type Reply, type RequestKind, type Run, type Settings } from "@/lib/types";

interface DataState {
  demo: boolean;
  loading: boolean;
  error: string | null;
  lastLoadedAt: Date | null;
  jobs: Job[];
  runs: Run[];
  replies: Reply[];
  batches: Batch[];
  settings: Settings | null;
  linkedinToSend: number;
  requests: BotRequest[];
  contacts: Contact[];
  updateContact: (id: string, patch: Partial<Contact>, okMessage?: string) => Promise<void>;
  setStatus: (jobId: string, status: JobStatus) => Promise<void>;
  toggleTick: (jobId: string, itemId: string) => Promise<void>;
  sendRequest: (kind: RequestKind, payload?: Record<string, unknown>) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  loadEvents: (jobId: string) => Promise<JobEvent[]>;
  reload: () => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export function DataProvider({ demo, children }: { demo: boolean; children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [linkedinToSend, setLinkedinToSend] = useState(0);
  const [requests, setRequests] = useState<BotRequest[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);
  const demoEvents = useRef<JobEvent[]>([]);

  const reload = useCallback(async () => {
    if (demo) {
      const d = demoData();
      setJobs(d.jobs);
      setRuns(d.runs);
      setReplies(d.replies);
      setBatches(d.batches);
      setSettings(d.settings);
      setLinkedinToSend(d.linkedinToSend);
      setContacts(d.contacts);
      demoEvents.current = d.events;
      setLoading(false);
      setLastLoadedAt(new Date());
      return;
    }
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const [j, r, p, b, s, l, q] = await Promise.all([
      // New jobs from the last 30 days, plus every job Jai has acted on, however old.
      // Skipped jobs never come back: the row stays so the bots don't re-add it, but it's not loaded.
      supabase
        .from("jobs")
        .select("*, company:companies(*), score:job_scores(*)")
        .neq("status", "skipped")
        .or(`first_seen_at.gte.${since},status.in.(shortlisted,applied,contacted,replied,interview,offer,rejected)`)
        .order("first_seen_at", { ascending: false })
        .limit(1000),
      supabase.from("runs").select("*").order("started_at", { ascending: false }).limit(40),
      supabase
        .from("replies")
        .select("*, contact:contacts(name, company:companies(name))")
        .order("received_at", { ascending: false })
        .limit(30),
      supabase.from("batches").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("contacts")
        .select("*, company:companies(name), job:jobs(title)")
        .eq("do_not_contact", false)
        .order("created_at", { ascending: true })
        .limit(1000),
      supabase.from("requests").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    const firstError = [j, r, p, b, s, l, q].find((x) => x.error)?.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setError(null);
      setJobs(
        (j.data ?? []).map((row) => ({
          ...row,
          company: one(row.company),
          score: one(row.score) as JobScore | null,
        })) as Job[],
      );
      setRuns((r.data ?? []) as Run[]);
      setReplies(
        (p.data ?? []).map((row) => {
          const contact = one(row.contact) as { name?: string; company?: unknown } | null;
          const comp = one(contact?.company as { name?: string } | null);
          return { ...row, contact_name: contact?.name ?? null, company_name: comp?.name ?? null };
        }) as Reply[],
      );
      setBatches((b.data ?? []) as Batch[]);
      setSettings((s.data ?? null) as Settings | null);
      const cs = (l.data ?? []).map((row) => {
        const { company, job, ...rest } = row as Record<string, unknown>;
        return {
          ...rest,
          company_name: one(company as { name?: string } | null)?.name ?? null,
          job_title: one(job as { title?: string } | null)?.title ?? null,
        };
      }) as Contact[];
      setContacts(cs);
      setLinkedinToSend(cs.filter((c) => c.linkedin_status === "not_sent" && c.linkedin_note).length);
      setRequests((q.data ?? []) as BotRequest[]);
      setLastLoadedAt(new Date());
    }
    setLoading(false);
  }, [demo]);

  useEffect(() => {
    void reload();
    if (demo) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => void reload(), 600);
      })
      .subscribe();
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [demo, reload]);

  const writeStatus = useCallback(
    async (jobId: string, status: JobStatus) => {
      setJobs((js) => js.map((x) => (x.id === jobId ? { ...x, status, status_changed_at: new Date().toISOString() } : x)));
      if (demo) {
        demoEvents.current = [
          { id: Date.now(), job_id: jobId, kind: "status", detail: `Moved to ${STATUS_LABEL[status]}`, created_at: new Date().toISOString() },
          ...demoEvents.current,
        ];
        return true;
      }
      const { error: e } = await supabase.from("jobs").update({ status }).eq("id", jobId);
      if (e) {
        toast.error(`Couldn't update the job: ${e.message}`);
        return false;
      }
      return true;
    },
    [demo],
  );

  const setStatus = useCallback(
    async (jobId: string, status: JobStatus) => {
      const before = jobs.find((x) => x.id === jobId);
      if (!before || before.status === status) return;
      const ok = await writeStatus(jobId, status);
      if (!ok) {
        await writeStatus(jobId, before.status);
        return;
      }
      const where =
        status === "skipped"
          ? "Gone for good. The bots won't add it back."
          : status === "applied"
            ? "Moved to the Applied tab. Its contacts are on the Contacts page."
            : `Was ${STATUS_LABEL[before.status]}.`;
      toast.success(`${before.title} at ${before.company_name}: ${STATUS_LABEL[status]}`, {
        description: demo ? "Preview mode: not saved." : where,
        action: { label: "Undo", onClick: () => void writeStatus(jobId, before.status) },
      });
    },
    [demo, jobs, writeStatus],
  );

  const toggleTick = useCallback(
    async (jobId: string, itemId: string) => {
      const target = jobs.find((x) => x.id === jobId);
      if (!target?.score) return;
      const ticked = target.score.ticked_items.includes(itemId)
        ? target.score.ticked_items.filter((i) => i !== itemId)
        : [...target.score.ticked_items, itemId];
      setJobs((js) =>
        js.map((x) => (x.id === jobId && x.score ? { ...x, score: { ...x.score, ticked_items: ticked } } : x)),
      );
      if (demo) return;
      const { error: e } = await supabase.from("job_scores").update({ ticked_items: ticked }).eq("job_id", jobId);
      if (e) toast.error(`Couldn't save the tick: ${e.message}`);
    },
    [demo, jobs],
  );

  const sendRequest = useCallback(
    async (kind: RequestKind, payload: Record<string, unknown> = {}) => {
      if (demo) {
        const fake: BotRequest = { id: `demo-${Date.now()}`, kind, payload, status: "pending", result: null, created_at: new Date().toISOString(), done_at: null };
        setRequests((rs) => [fake, ...rs]);
        toast.success("Preview mode: request shown but not sent.");
        return;
      }
      const { data, error: e } = await supabase.from("requests").insert({ kind, payload }).select().single();
      if (e) {
        toast.error(`Couldn't send the request: ${e.message}`, { description: "Nothing was saved. Try again in a moment." });
        return;
      }
      setRequests((rs) => [data as BotRequest, ...rs]);
      toast.success("Request saved. The bot picks it up on its next check.");
    },
    [demo],
  );

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      setSettings((s) => (s ? { ...s, ...patch } : s));
      if (demo) return;
      const { error: e } = await supabase.from("settings").update(patch).eq("id", 1);
      if (e) toast.error(`Couldn't save settings: ${e.message}`);
      else toast.success("Settings saved.");
    },
    [demo],
  );

  const updateContact = useCallback(
    async (id: string, patch: Partial<Contact>, okMessage?: string) => {
      const before = contacts.find((c) => c.id === id);
      const apply = (p: Partial<Contact>) => setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));
      apply(patch);
      if (patch.linkedin_status !== undefined)
        setLinkedinToSend((n) => Math.max(0, n + (patch.linkedin_status === "not_sent" ? 1 : before?.linkedin_status === "not_sent" ? -1 : 0)));
      if (demo) return;
      const dbPatch: Partial<Contact> = { ...patch };
      delete dbPatch.company_name;
      delete dbPatch.job_title;
      const { error: e } = await supabase.from("contacts").update(dbPatch).eq("id", id);
      if (e) {
        if (before) apply(before);
        toast.error(`Couldn't save: ${e.message}`);
        return;
      }
      if (okMessage && before) {
        const undo: Partial<Contact> = {};
        for (const k of Object.keys(patch) as (keyof Contact)[]) (undo as Record<string, unknown>)[k] = before[k];
        toast.success(okMessage, { action: { label: "Undo", onClick: () => void updateContact(id, undo) } });
      }
    },
    [demo, contacts],
  );

  const loadEvents = useCallback(
    async (jobId: string) => {
      if (demo) return demoEvents.current.filter((e) => e.job_id === jobId);
      const { data } = await supabase
        .from("job_events")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as JobEvent[];
    },
    [demo],
  );

  const value = useMemo<DataState>(
    () => ({
      demo,
      loading,
      error,
      lastLoadedAt,
      jobs,
      runs,
      replies,
      batches,
      settings,
      linkedinToSend,
      requests,
      contacts,
      updateContact,
      setStatus,
      toggleTick,
      sendRequest,
      updateSettings,
      loadEvents,
      reload,
    }),
    [demo, loading, error, lastLoadedAt, jobs, runs, replies, batches, settings, linkedinToSend, requests, contacts, updateContact, setStatus, toggleTick, sendRequest, updateSettings, loadEvents, reload],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}

export function useLastRuns() {
  const { runs } = useData();
  return useMemo(() => {
    const latest = new Map<string, Run>();
    for (const r of runs) if (!latest.has(r.bot)) latest.set(r.bot, r);
    return latest;
  }, [runs]);
}
