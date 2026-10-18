import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard-card";
import { PageTitle } from "@/components/page-title";
import { useData } from "@/lib/data";

type NumberKey = "score_threshold" | "email_cap" | "freshness_days";

function NumberSetting({ id, label, hint, min, max, value, onSave }: {
  id: NumberKey;
  label: string;
  hint: string;
  min: number;
  max: number;
  value: number;
  onSave: (v: number) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const errorId = `${id}-error`;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        aria-describedby={error ? errorId : `${id}-hint`}
        aria-invalid={Boolean(error)}
        className="w-28 font-mono"
        defaultValue={value}
        id={id}
        inputMode="numeric"
        max={max}
        min={min}
        onBlur={(e) => {
          const v = Number(e.target.value);
          if (e.target.value.trim() === "" || !Number.isInteger(v) || v < min || v > max) {
            setError(`Use a whole number from ${min} to ${max}. Not saved.`);
            return;
          }
          setError(null);
          if (v !== value) onSave(v);
        }}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        type="number"
      />
      {error ? (
        <p className="text-destructive text-xs" id={errorId} role="alert">
          {error}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function SettingsPage() {
  const { settings, updateSettings, sendRequest, loading } = useData();

  if (!settings) {
    return loading ? (
      <p aria-busy="true" className="text-muted-foreground text-sm">
        Loading settings...
      </p>
    ) : (
      <p className="text-sm" role="alert">
        Settings couldn't be found in the database. Ask Claude to check the settings table.
      </p>
    );
  }

  const numberField = (key: NumberKey, label: string, hint: string, min: number, max: number) => (
    <NumberSetting
      hint={hint}
      id={key}
      key={key}
      label={label}
      max={max}
      min={min}
      onSave={(v) => void updateSettings({ [key]: v })}
      value={settings[key]}
    />
  );

  return (
    <div>
      <PageTitle description="The bots read these on every run." title="Settings" />
      <div className="grid gap-px bg-border p-px md:grid-cols-2">
        <DashboardCard className="gap-0">
          <CardHeader className="border-b">
            <CardTitle className="font-heading text-xl font-normal">This week</CardTitle>
            <CardDescription>Week A is India and remote. Week B is the international portals. They swap every Monday.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row" role="group" aria-label="Week focus">
              {(["A", "B"] as const).map((w) => (
                <Button
                  aria-pressed={settings.week_type === w}
                  className="justify-start sm:justify-center"
                  key={w}
                  onClick={() => void updateSettings({ week_type: w })}
                  variant={settings.week_type === w ? "default" : "outline"}
                >
                  Week {w}: {w === "A" ? "India + remote" : "International"}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void updateSettings({ paused: !settings.paused })} variant={settings.paused ? "default" : "outline"}>
                {settings.paused ? "Resume all bots" : "Pause all bots"}
              </Button>
              <Button onClick={() => void sendRequest("run_now", { bot: "job_scout" })} variant="ghost">
                Run Job Scout now
              </Button>
            </div>
            {settings.paused && <p className="text-xs">Paused: bots skip their runs until you resume.</p>}
          </CardContent>
        </DashboardCard>

        <DashboardCard className="gap-0">
          <CardHeader className="border-b">
            <CardTitle className="font-heading text-xl font-normal">Limits</CardTitle>
            <CardDescription>Changes save when you leave the box or press Enter.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            {numberField("score_threshold", "Hot job score", "Jobs at or above this show on Today.", 0, 100)}
            {numberField("freshness_days", "Freshest jobs, days", "Job Scout ignores jobs older than this.", 1, 14)}
            {numberField("email_cap", "Emails per day", "Starts at 10 while the inbox warms up.", 1, 40)}
          </CardContent>
        </DashboardCard>

        <DashboardCard className="gap-0 md:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="font-heading text-xl font-normal">Search profile</CardTitle>
            <CardDescription>Set in the PRD. Ask Claude to change these, so the bot rules stay in step.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Titles</dt>
              <dd>{settings.titles.join(", ")}</dd>
              <dt className="text-muted-foreground">Contacts per job</dt>
              <dd>
                {settings.contacts_hiring_managers} hiring managers, {settings.contacts_peers} peers
              </dd>
              <dt className="text-muted-foreground">Notice period</dt>
              <dd>{settings.notice_period}</dd>
            </dl>
          </CardContent>
        </DashboardCard>
      </div>
    </div>
  );
}
