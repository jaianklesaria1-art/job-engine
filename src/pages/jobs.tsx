import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KanbanIcon, LayoutGridIcon, SearchIcon, SlidersHorizontalIcon, TableIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { KanbanBoard, KanbanCard, KanbanCards, KanbanHeader, KanbanProvider } from "@/components/kibo-ui/kanban";
import { JobCard } from "@/components/job-card";
import { DeadlineBadge, FreshnessBadge, ScoreBadge, SponsorBadge, daysUntil } from "@/components/job-bits";
import { PageTitle } from "@/components/page-title";
import { useData } from "@/lib/data";
import { freshnessOf, remoteLabel, timeAgo, jobDate, type Freshness } from "@/lib/format";
import { JOB_STATUSES, STATUS_LABEL, type Job, type JobStatus } from "@/lib/types";
import { useHotkeys } from "@/hooks/use-hotkeys";

type View = "cards" | "table" | "board";
const VIEWS: View[] = ["cards", "table", "board"];

function readView(): View {
  try {
    const v = localStorage.getItem("jobs-view");
    if (v === "cards" || v === "table" || v === "board") return v;
  } catch {
    /* storage blocked */
  }
  return window.innerWidth < 768 ? "cards" : "table";
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:w-auto";

export function JobsPage() {
  const { jobs, settings, setStatus, loading } = useData();
  const navigate = useNavigate();
  const [view, setViewState] = useState<View>(readView);
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState<"threshold" | "all">("threshold");
  const [fresh, setFresh] = useState<Freshness | "all">("all");
  const [remote, setRemote] = useState<Job["remote_type"] | "all">("all");
  const [week, setWeek] = useState<"A" | "B" | "all">("all");
  const [status, setStatusFilter] = useState<JobStatus | "open" | "all">("open");
  const [title, setTitle] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "score" | "company" | "deadline">("newest");
  const [selected, setSelected] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const threshold = settings?.score_threshold ?? 75;

  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem("jobs-view", v);
    } catch {
      /* storage blocked */
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = jobs.filter((j) => {
      if (q && !`${j.title} ${j.company_name} ${j.city ?? ""} ${j.country ?? ""}`.toLowerCase().includes(q)) return false;
      if (minScore === "threshold" && (j.score?.score_now ?? 0) < threshold) return false;
      if (fresh !== "all" && freshnessOf(j) !== fresh) return false;
      if (remote !== "all" && j.remote_type !== remote) return false;
      if (week !== "all" && j.week_type !== week) return false;
      if (title !== "all" && j.title_group !== title) return false;
      if (status === "open" && ["skipped", "rejected"].includes(j.status)) return false;
      if (status !== "open" && status !== "all" && j.status !== status) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "score") return (b.score?.score_now ?? 0) - (a.score?.score_now ?? 0);
      if (sort === "company") return a.company_name.localeCompare(b.company_name);
      if (sort === "deadline") {
        // Open deadlines soonest first, then jobs with no stated date, then ones already closed.
        const rank = (j: Job) => (!j.deadline ? 1e6 : daysUntil(j.deadline) < 0 ? 2e6 : daysUntil(j.deadline));
        return rank(a) - rank(b) || jobDate(b).getTime() - jobDate(a).getTime();
      }
      return jobDate(b).getTime() - jobDate(a).getTime();
    });
  }, [jobs, query, minScore, threshold, fresh, remote, week, title, status, sort]);

  useEffect(() => setSelected(0), [query, minScore, fresh, remote, week, title, status, sort]);
  useEffect(() => {
    document.querySelector(`[data-job-id="${filtered[selected]?.id}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selected, filtered]);

  useEffect(() => {
    if (selected > 0 && selected >= filtered.length) setSelected(Math.max(0, filtered.length - 1));
  }, [filtered.length, selected]);

  const activeFilters =
    Number(minScore !== "threshold") + Number(fresh !== "all") + Number(remote !== "all") + Number(week !== "all") + Number(status !== "open") + Number(title !== "all");

  const clearFilters = () => {
    setQuery("");
    setMinScore("threshold");
    setFresh("all");
    setRemote("all");
    setWeek("all");
    setStatusFilter("open");
    setTitle("all");
  };
  const anyFilter = activeFilters > 0 || query.trim() !== "";

  const current = filtered[selected];
  useHotkeys(
    {
      j: () => setSelected((i) => Math.min(filtered.length - 1, i + 1)),
      k: () => setSelected((i) => Math.max(0, i - 1)),
      Enter: () => current && navigate(`/jobs/${current.id}`),
      s: () => current && void setStatus(current.id, "shortlisted"),
      x: () => current && void setStatus(current.id, "skipped"),
      v: () => setView(VIEWS[(VIEWS.indexOf(view) + 1) % VIEWS.length]),
      "/": () => searchRef.current?.focus(),
    },
    view !== "board",
  );

  return (
    <div className="flex flex-col">
      <PageTitle
        actions={
          <ToggleGroup
            aria-label="View"
            onValueChange={(v) => v[0] && setView(v[0] as View)}
            value={[view]}
            variant="outline"
          >
            <ToggleGroupItem aria-label="Cards" value="cards">
              <LayoutGridIcon />
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="Table" value="table">
              <TableIcon />
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="Board" value="board">
              <KanbanIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        }
        description={
          <>
            {filtered.length} of {jobs.length} jobs from the last 30 days. Scores show CV fit out of 100.
            <span data-hint="keyboard"> Press ? for shortcuts.</span>
          </>
        }
        title="Jobs"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 md:w-80 md:flex-none xl:w-64">
          <SearchIcon aria-hidden="true" className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
          <Input
            aria-label="Search jobs"
            className="pl-8"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
            placeholder="Search title, company, city"
            ref={searchRef}
            value={query}
          />
        </div>
        <Button
          aria-controls="job-filters"
          aria-expanded={showFilters}
          className="md:hidden"
          onClick={() => setShowFilters((v) => !v)}
          variant="outline"
        >
          <SlidersHorizontalIcon /> Filters
          {activeFilters > 0 && <span className="rounded-full bg-foreground px-1.5 font-mono text-[10px] text-background">{activeFilters}</span>}
        </Button>
        <div
          className={cn("w-full grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center xl:w-auto xl:flex-1", showFilters ? "grid" : "hidden")}
          id="job-filters"
        >
        <select aria-label="Score" className={selectClass} onChange={(e) => setMinScore(e.target.value as "threshold" | "all")} value={minScore}>
          <option value="threshold">Score {threshold}+</option>
          <option value="all">Any score</option>
        </select>
        <select aria-label="Freshness" className={selectClass} onChange={(e) => setFresh(e.target.value as Freshness | "all")} value={fresh}>
          <option value="all">Any age</option>
          <option value="hot">Hot (under 24 h)</option>
          <option value="fresh">Fresh (1 to 3 days)</option>
          <option value="ok">Recent (3 to 5 days)</option>
        </select>
        <select aria-label="Status" className={selectClass} onChange={(e) => setStatusFilter(e.target.value as JobStatus | "open" | "all")} value={status}>
          <option value="open">Open (hide skipped)</option>
          <option value="all">All statuses</option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select aria-label="Job title" className={selectClass} onChange={(e) => setTitle(e.target.value)} value={title}>
          <option value="all">All titles</option>
          {(settings?.titles ?? []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select aria-label="Work type" className={selectClass} onChange={(e) => setRemote(e.target.value as Job["remote_type"] | "all")} value={remote}>
          <option value="all">Any work type</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>
        <select aria-label="Week" className={selectClass} onChange={(e) => setWeek(e.target.value as "A" | "B" | "all")} value={week}>
          <option value="all">Both weeks</option>
          <option value="A">Week A: India + Remote</option>
          <option value="B">Week B: International</option>
        </select>
        <select aria-label="Sort" className={cn(selectClass, "md:ml-auto")} onChange={(e) => setSort(e.target.value as "newest" | "score" | "company" | "deadline")} value={sort}>
          <option value="newest">Newest first</option>
          <option value="score">Highest score</option>
          <option value="company">Company A to Z</option>
          <option value="deadline">Closing soonest</option>
        </select>
        {anyFilter && (
          <Button className="col-span-2 md:col-span-1" onClick={clearFilters} size="sm" variant="ghost">
            Clear filters
          </Button>
        )}
        </div>
      </div>

      {loading && jobs.length === 0 && (
        <div aria-busy="true" aria-label="Loading jobs" className="grid gap-px bg-border p-px md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="space-y-3 bg-background p-4" key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed p-10 text-center text-muted-foreground text-sm">
          {jobs.length === 0 ? (
            "No jobs yet. Job Scout fills this list on its next run."
          ) : (
            <>
              <span>
                No jobs match these filters. {jobs.length} {jobs.length === 1 ? "job is" : "jobs are"} hidden.
              </span>
              <Button onClick={clearFilters} size="sm" variant="outline">
                Clear filters
              </Button>
            </>
          )}
        </div>
      )}

      {view === "cards" && filtered.length > 0 && (
        <div className="grid gap-px bg-border p-px md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((j, i) => (
            <JobCard job={j} key={j.id} selected={i === selected} />
          ))}
        </div>
      )}

      {view === "table" && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Score</TableHead>
                <TableHead>Job</TableHead>
                <TableHead className="hidden sm:table-cell">Where</TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Missing keywords</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((j, i) => (
                <TableRow
                  aria-selected={i === selected}
                  className={cn("cursor-pointer", i === selected && "bg-muted/60")}
                  data-job-id={j.id}
                  key={j.id}
                  onClick={() => navigate(`/jobs/${j.id}`)}
                >
                  <TableCell>
                    <ScoreBadge score={j.score?.score_now} />
                  </TableCell>
                  <TableCell>
                    {j.deadline && <DeadlineBadge className="mb-1" deadline={j.deadline} source={j.deadline_source} />}
                    <Link className="block font-medium hover:underline" onClick={(e) => e.stopPropagation()} to={`/jobs/${j.id}`}>
                      {j.title}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      {j.company_name}
                      <span className="sm:hidden"> · {j.city ?? remoteLabel(j.remote_type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm sm:table-cell">
                    {j.city ?? j.location ?? "Not stated"}
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      {remoteLabel(j.remote_type)} <SponsorBadge status={j.company?.sponsor_status} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <FreshnessBadge job={j} />
                    <div className="mt-0.5 text-muted-foreground text-xs">{timeAgo(jobDate(j))}</div>
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">{STATUS_LABEL[j.status]}</TableCell>
                  <TableCell className="hidden max-w-56 truncate text-muted-foreground text-xs lg:table-cell">
                    {j.score?.keywords.filter((k) => !k.present).map((k) => k.keyword).join(", ") || "None"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {view === "board" && <JobsBoard jobs={filtered} onMove={(id, s) => void setStatus(id, s)} />}
    </div>
  );
}

const BOARD_COLUMNS: JobStatus[] = ["found", "shortlisted", "applied", "contacted", "replied", "interview", "offer", "rejected"];

type BoardItem = { id: string; name: string; column: string; job: Job };

function JobsBoard({ jobs, onMove }: { jobs: Job[]; onMove: (id: string, s: JobStatus) => void }) {
  const toItems = (js: Job[]): BoardItem[] =>
    js.filter((j) => j.status !== "skipped").map((j) => ({ id: j.id, name: j.title, column: j.status, job: j }));
  const [items, setItems] = useState<BoardItem[]>(() => toItems(jobs));
  const startColumn = useRef<string | null>(null);

  useEffect(() => setItems(toItems(jobs)), [jobs]);

  return (
    <div className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-2 md:snap-none">
      <p className="sticky left-0 mb-2 text-muted-foreground text-xs">
        <span className="pointer-coarse:hidden">Drag a card to change its status.</span>
        <span className="hidden pointer-coarse:inline">Press and hold a card, then drag it to change its status.</span> Moving a job to Applied
        unlocks its hiring manager emails.
      </p>
      <KanbanProvider
        className="min-w-[2032px] auto-cols-[minmax(240px,1fr)] md:min-w-[1872px] md:auto-cols-[minmax(220px,1fr)]"
        columns={BOARD_COLUMNS.map((s) => ({ id: s, name: STATUS_LABEL[s] }))}
        data={items}
        onDataChange={(d) => setItems(d.map((x) => ({ ...x })))}
        onDragEnd={(e) => {
          const moved = items.find((x) => x.id === e.active.id);
          if (moved && moved.column !== startColumn.current) onMove(moved.id, moved.column as JobStatus);
          startColumn.current = null;
        }}
        onDragStart={(e) => {
          startColumn.current = items.find((x) => x.id === e.active.id)?.column ?? null;
        }}
      >
        {(column) => (
          <KanbanBoard className="snap-start bg-muted/40" id={column.id} key={column.id}>
            <KanbanHeader className="flex items-center justify-between font-normal">
              <span>{column.name}</span>
              <span className="font-mono text-muted-foreground text-xs">
                {items.filter((x) => x.column === column.id).length}
              </span>
            </KanbanHeader>
            <KanbanCards id={column.id}>
              {(item: BoardItem) => (
                <KanbanCard column={item.column} id={item.id} key={item.id} name={item.name}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        className="line-clamp-2 font-medium text-sm leading-snug underline-offset-4 hover:underline"
                        onPointerDown={(e) => e.stopPropagation()}
                        to={`/jobs/${item.job.id}`}
                      >
                        {item.job.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">{item.job.company_name}</p>
                    </div>
                    <ScoreBadge score={item.job.score?.score_now} />
                  </div>
                  <div className="flex items-center gap-2">
                    <FreshnessBadge job={item.job} />
                    <span className="text-muted-foreground text-xs">{item.job.city ?? remoteLabel(item.job.remote_type)}</span>
                  </div>
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  );
}
