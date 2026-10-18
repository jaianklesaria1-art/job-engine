import type { LucideIcon } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageTitle } from "@/components/page-title";

export function ComingSoonPage({ title, icon: Icon, bot, what }: { title: string; icon: LucideIcon; bot: string; what: string }) {
  return (
    <div>
      <PageTitle title={title} />
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
          <EmptyTitle>Arrives with {bot}</EmptyTitle>
          <EmptyDescription>{what}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
