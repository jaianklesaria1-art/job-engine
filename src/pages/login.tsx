import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OWNER_EMAIL, supabase, supabaseConfigured } from "@/lib/supabase";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (email.trim().toLowerCase() !== OWNER_EMAIL) {
      setState("error");
      setMessage("This dashboard is private. Only the owner's email can sign in.");
      return;
    }
    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email: OWNER_EMAIL,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  };

  return (
    <main className="grid min-h-svh place-items-center bg-background p-4">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[11px] text-muted-foreground uppercase">Job Engine</p>
        <h1 className="mt-2 font-heading text-5xl leading-none tracking-tight">Sign in</h1>
        {state === "sent" ? (
          <div className="mt-6 space-y-3 text-sm" role="status">
            <p>
              Check your inbox for a sign-in link from Supabase. It opens this dashboard. It can take a minute, and might land in spam.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void submit()} size="sm" variant="outline">
                Send it again
              </Button>
              <Button onClick={() => setState("idle")} size="sm" variant="ghost">
                Use a different email
              </Button>
            </div>
          </div>
        ) : (
          <form className="mt-6 flex flex-col gap-3" onSubmit={submit}>
            <Label htmlFor="email">Email</Label>
            <Input autoComplete="email" id="email" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />
            <Button disabled={state === "sending" || !supabaseConfigured} type="submit">
              {state === "sending" ? "Sending..." : "Email me a sign-in link"}
            </Button>
            {!supabaseConfigured && (
              <p className="text-destructive text-xs" role="alert">
                Sign-in is off: this build has no Supabase keys. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify, then redeploy.
              </p>
            )}
            {state === "error" && (
              <p className="text-destructive text-xs" role="alert">
                {message}
              </p>
            )}
          </form>
        )}
        <a className="mt-8 inline-block text-muted-foreground text-sm underline-offset-4 hover:underline" href="/?demo=1">
          Preview with sample data
        </a>
      </div>
    </main>
  );
}
