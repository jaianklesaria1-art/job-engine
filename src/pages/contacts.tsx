import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { TabBar } from "@/components/tab-bar";
import { ContactRow, contactDone } from "@/components/contact-row";
import { Skeleton } from "@/components/ui/skeleton";
import { useData } from "@/lib/data";
import type { Contact } from "@/lib/types";

type Show = "todo" | "done" | "all";

export function ContactsPage() {
  const { contacts, jobs, loading } = useData();
  const [show, setShow] = useState<Show>("todo");

  const groups = useMemo(() => {
    const list = contacts.filter((c) => (show === "all" ? true : show === "done" ? contactDone(c) : !contactDone(c)));
    const byKey = new Map<string, { key: string; jobId: string | null; title: string; company: string; people: Contact[] }>();
    for (const c of list) {
      const key = c.job_id ?? `company-${c.company_id}`;
      if (!byKey.has(key)) byKey.set(key, { key, jobId: c.job_id, title: c.job_title ?? "No job linked", company: c.company_name ?? "Unknown company", people: [] });
      byKey.get(key)!.people.push(c);
    }
    // Hiring side first inside each group; groups for jobs you've applied to come first.
    const applied = (g: { jobId: string | null }) => (jobs.find((j) => j.id === g.jobId)?.status === "applied" ? 0 : 1);
    return [...byKey.values()]
      .map((g) => ({ ...g, people: g.people.sort((a, b) => (a.type === b.type ? 0 : a.type === "hiring_manager" ? -1 : 1)) }))
      .sort((a, b) => applied(a) - applied(b) || a.company.localeCompare(b.company));
  }, [contacts, jobs, show]);

  const todo = contacts.filter((c) => !contactDone(c)).length;
  const notes = contacts.filter((c) => c.linkedin_note && c.linkedin_status === "not_sent").length;
  const emails = contacts.filter((c) => c.email && (c.email_status === "verified" || c.email_status === "accept_all") && !c.last_contacted_at).length;

  return (
    <div className="flex flex-col">
      <PageTitle
        description={`${emails} ${emails === 1 ? "email" : "emails"} and ${notes} LinkedIn ${notes === 1 ? "note" : "notes"} to send. You send each one by hand, then tick it here.`}
        title="Contacts"
      />

      <TabBar
        className="mb-4"
        items={[
          { value: "todo", label: "To send", count: todo },
          { value: "done", label: "Sent", count: contacts.length - todo },
          { value: "all", label: "Everyone", count: contacts.length },
        ]}
        label="Show"
        onChange={setShow}
        size="lg"
        value={show}
      />

      {loading && contacts.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton className="h-28 w-full" key={i} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground text-sm">
          {show === "todo" ? "Nothing left to send. Nice work." : "No contacts here yet."}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {groups.map((g) => (
            <section className="overflow-hidden rounded-xl border" key={g.key}>
              <header className="flex items-start justify-between gap-3 border-b bg-muted/40 px-5 py-3">
                <div className="min-w-0">
                  <h2 className="font-heading text-xl leading-tight">{g.company}</h2>
                  <p className="truncate text-muted-foreground text-xs">{g.title}</p>
                </div>
                {g.jobId && (
                  <Link className="inline-flex shrink-0 items-center gap-1 text-xs underline-offset-4 hover:underline" to={`/jobs/${g.jobId}`}>
                    Job <ArrowRightIcon className="size-3" />
                  </Link>
                )}
              </header>
              <ul className="divide-y">
                {g.people.map((c) => (
                  <ContactRow contact={c} key={c.id} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
