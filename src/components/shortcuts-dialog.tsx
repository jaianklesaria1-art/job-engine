import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const groups: { title: string; keys: [string, string][] }[] = [
  {
    title: "Anywhere",
    keys: [
      ["?", "Show or hide this panel"],
      ["G then H", "Go to Home"],
      ["G then T", "Go to Today"],
      ["G then J", "Go to Jobs"],
      ["G then C", "Go to Contacts"],
      ["G then P", "Go to PhD"],
      ["G then O", "Go to Outreach"],
      ["G then R", "Go to Review"],
      ["G then S", "Go to Settings"],
    ],
  },
  {
    title: "Jobs list",
    keys: [
      ["J / K", "Next / previous job"],
      ["Enter", "Open the selected job"],
      ["S", "Shortlist the selected job"],
      ["A", "Mark the selected job applied"],
      ["X", "Skip the selected job (hidden for good)"],
      ["V", "Switch view: cards, table, board"],
      ["/", "Search jobs"],
    ],
  },
  {
    title: "Job detail",
    keys: [
      ["A", "Mark as applied"],
      ["S", "Shortlist"],
      ["X", "Skip"],
      ["Esc", "Back to the list"],
    ],
  },
];

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Keyboard shortcuts</DialogTitle>
          <DialogDescription>Shortcuts are off while you're typing in a box.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-2">
          {groups.map((g) => (
            <section key={g.title}>
              <h3 className="mb-2 font-mono text-[11px] text-muted-foreground uppercase">{g.title}</h3>
              <dl className="space-y-1.5">
                {g.keys.map(([k, label]) => (
                  <div className="flex items-center justify-between gap-3 text-sm" key={k}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd>
                      <kbd className="whitespace-nowrap rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{k}</kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
