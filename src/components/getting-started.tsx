import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "@/components/dashboard-card";
import { cn } from "@/lib/utils";
import { useData, useLastRuns } from "@/lib/data";

/** First-run guide, shown on Today until the first jobs arrive. */
export function GettingStarted() {
  const { jobs, sendRequest } = useData();
  const scout = useLastRuns().get("job_scout");

  const steps = [
    { title: "Sign in", detail: "Only your email can open this dashboard.", done: true },
    {
      title: "Approve your experience bank",
      detail: "The true lines the bots may use in your CV. We go through it together in chat.",
      done: null,
    },
    {
      title: "Job Scout's first run",
      detail: scout ? "Done. It runs again on its schedule." : "It searches this week's portals and scores each job against your CV.",
      done: Boolean(scout),
    },
    { title: "Review your first jobs", detail: "Shortlist the good ones, skip the rest.", done: jobs.length > 0 },
  ];

  return (
    <DashboardCard className="gap-0 border">
      <CardHeader className="border-b">
        <CardTitle className="font-heading text-2xl font-normal">Getting started</CardTitle>
        <CardDescription>Nothing to show yet. Here's what happens before the first jobs land.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ol className="divide-y">
          {steps.map((s, i) => (
            <li className="flex items-start gap-3 px-6 py-3" key={s.title}>
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]",
                  s.done && "border-emerald-600 bg-emerald-600 text-white",
                )}
              >
                {s.done ? <CheckIcon className="size-3.5" /> : i + 1}
              </span>
              <div className="min-w-0">
                <p className={cn("font-medium text-sm", s.done && "text-muted-foreground line-through decoration-1")}>
                  {s.title}
                  <span className="sr-only">{s.done ? " (done)" : s.done === false ? " (not done yet)" : ""}</span>
                </p>
                <p className="text-muted-foreground text-xs">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2 border-t px-6 pt-4">
          {!scout && (
            <Button onClick={() => void sendRequest("run_now", { bot: "job_scout" })} size="sm">
              Run Job Scout now
            </Button>
          )}
          <Button render={<a href="/?demo=1" />} nativeButton={false} size="sm" variant="outline">
            See it with sample data
          </Button>
        </div>
      </CardContent>
    </DashboardCard>
  );
}
