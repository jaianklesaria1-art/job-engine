import { useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon, MailIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data";
import type { Contact } from "@/lib/types";

const hasEmail = (c: Contact) => Boolean(c.email) && (c.email_status === "verified" || c.email_status === "accept_all");

export const contactDone = (c: Contact) => {
  const liDone = !c.linkedin_note || c.linkedin_status !== "not_sent";
  const mailDone = !hasEmail(c) || Boolean(c.last_contacted_at);
  return liDone && mailDone;
};

function CopyButton({ text, what }: { text: string; what: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      aria-label={`Copy ${what}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Couldn't copy. Select the text by hand instead.");
        }
      }}
      size="sm"
      variant="outline"
    >
      <span className="relative inline-flex size-3.5">
        <CopyIcon className={cn("absolute inset-0 transition-all duration-200", copied && "scale-50 opacity-0")} />
        <CheckIcon className={cn("absolute inset-0 text-emerald-600 transition-all duration-200", !copied && "scale-50 opacity-0")} />
      </span>
      {copied ? "Copied" : `Copy ${what}`}
    </Button>
  );
}

/** One person to reach: email, LinkedIn note, and two ticks Jai sets after sending by hand. */
export function ContactRow({ contact: c }: { contact: Contact }) {
  const { updateContact } = useData();
  const done = contactDone(c);
  const liSent = c.linkedin_status !== "not_sent";
  const emailed = Boolean(c.last_contacted_at);
  const linkedinSearch = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${c.name} ${c.company_name ?? ""}`)}`;

  return (
    <li className={cn("flex flex-col gap-3 px-5 py-4 transition-colors duration-300", done && "bg-muted/30")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("font-medium transition-colors", done && "text-muted-foreground")}>
            {c.name}
            {done && <CheckIcon aria-label="Done" className="ml-1.5 inline size-4 text-emerald-600" />}
          </p>
          <p className="text-muted-foreground text-xs">{c.role ?? "Role not recorded"}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[11px]",
            c.type === "hiring_manager" ? "bg-sky-600/10 text-sky-800 dark:text-sky-300" : "bg-muted text-muted-foreground",
          )}
        >
          {c.type === "hiring_manager" ? "Hiring side" : "Peer"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hasEmail(c) ? (
          <>
            <a className="inline-flex items-center gap-1.5 font-mono text-xs underline-offset-4 hover:underline" href={`mailto:${c.email}`}>
              <MailIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
              {c.email}
            </a>
            <CopyButton text={c.email!} what="email" />
            <Button
              aria-pressed={emailed}
              className={cn(emailed && "border-emerald-600/40 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300")}
              onClick={() =>
                void updateContact(
                  c.id,
                  { last_contacted_at: emailed ? null : new Date().toISOString() },
                  emailed ? `${c.name}: email unmarked` : `${c.name}: email marked sent`,
                )
              }
              size="sm"
              variant="outline"
            >
              <CheckIcon /> {emailed ? "Emailed" : "Mark emailed"}
            </Button>
          </>
        ) : (
          <span className="text-muted-foreground text-xs">No verified email. LinkedIn only.</span>
        )}
      </div>

      {c.linkedin_note ? (
        <div className="rounded-lg border bg-background p-3">
          <p className="text-sm leading-relaxed">{c.linkedin_note}</p>
          <p className={cn("mt-1 font-mono text-[11px]", c.linkedin_note.length > 300 ? "text-destructive" : "text-muted-foreground")}>
            {c.linkedin_note.length} / 300 characters
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={c.linkedin_note} what="note" />
            <Button nativeButton={false} render={<a href={c.linkedin_url ?? linkedinSearch} rel="noreferrer" target="_blank" />} size="sm" variant="outline">
              {c.linkedin_url ? <ExternalLinkIcon /> : <SearchIcon />}
              {c.linkedin_url ? "Open LinkedIn" : "Find on LinkedIn"}
            </Button>
            <Button
              aria-pressed={liSent}
              className={cn(liSent && "border-emerald-600/40 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300")}
              onClick={() =>
                void updateContact(
                  c.id,
                  { linkedin_status: liSent ? "not_sent" : "sent" },
                  liSent ? `${c.name}: note unmarked` : `${c.name}: LinkedIn note marked sent`,
                )
              }
              size="sm"
              variant="outline"
            >
              <CheckIcon /> {liSent ? "Note sent" : "Mark note sent"}
            </Button>
          </div>
        </div>
      ) : (
        c.linkedin_url && (
          <a className="inline-flex w-fit items-center gap-1 text-xs underline underline-offset-4" href={c.linkedin_url} rel="noreferrer" target="_blank">
            LinkedIn profile <ExternalLinkIcon aria-hidden="true" className="size-3" />
          </a>
        )
      )}
    </li>
  );
}
