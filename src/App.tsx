import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { Building2Icon, MailIcon, TrophyIcon, UsersIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/lib/data";
import { OWNER_EMAIL, supabase } from "@/lib/supabase";
import { TodayPage } from "@/pages/today";
import { JobsPage } from "@/pages/jobs";
import { JobDetailPage } from "@/pages/job-detail";
import { SettingsPage } from "@/pages/settings";
import { ComingSoonPage } from "@/pages/coming-soon";
import { LoginPage } from "@/pages/login";

function isDemo() {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get("demo") === "1") sessionStorage.setItem("demo", "1");
    if (p.get("demo") === "0") sessionStorage.removeItem("demo");
    return sessionStorage.getItem("demo") === "1";
  } catch {
    return new URLSearchParams(window.location.search).get("demo") === "1";
  }
}

function Routed() {
  return (
    <AppShell>
      <Routes>
        <Route element={<TodayPage />} path="/" />
        <Route element={<JobsPage />} path="/jobs" />
        <Route element={<JobDetailPage />} path="/jobs/:id" />
        <Route
          element={<ComingSoonPage bot="Contact Finder (Bot 2)" icon={Building2Icon} title="Companies" what="Every company with an open role, its size, funding, sponsorship and why it fits you." />}
          path="/companies"
        />
        <Route
          element={<ComingSoonPage bot="Contact Finder (Bot 2)" icon={UsersIcon} title="Contacts" what="Hiring managers and peers with verified emails, plus a LinkedIn note for each to send by hand." />}
          path="/contacts"
        />
        <Route
          element={<ComingSoonPage bot="Outreach (Bot 3)" icon={MailIcon} title="Outreach" what="Email batches to approve. Nothing sends until you say yes." />}
          path="/outreach"
        />
        <Route
          element={<ComingSoonPage bot="Inbox Tracker (Bot 4)" icon={TrophyIcon} title="Review" what="Your weekly numbers: jobs found, applied, emails sent, replies and interviews." />}
          path="/review"
        />
        <Route element={<SettingsPage />} path="/settings" />
        <Route element={<p className="text-muted-foreground text-sm">Page not found.</p>} path="*" />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  const [demo] = useState(isDemo);
  const [session, setSession] = useState<Session | null | undefined>(demo ? null : undefined);

  useEffect(() => {
    if (demo) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [demo]);

  if (!demo && session === undefined) {
    return (
      <main aria-busy="true" className="grid min-h-svh place-items-center bg-background">
        <p className="animate-pulse font-heading text-2xl text-muted-foreground motion-reduce:animate-none">Job Engine</p>
        <span className="sr-only">Checking your sign-in</span>
      </main>
    );
  }

  if (!demo && (!session || session.user.email?.toLowerCase() !== OWNER_EMAIL)) return <LoginPage />;

  return (
    <BrowserRouter>
      <DataProvider demo={demo}>
        <Routed />
      </DataProvider>
    </BrowserRouter>
  );
}
