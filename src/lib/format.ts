import type { Job } from "@/lib/types";

export type Freshness = "hot" | "fresh" | "ok" | "old";

export function jobDate(job: Pick<Job, "posted_at" | "first_seen_at">) {
  return new Date(job.posted_at ?? job.first_seen_at);
}

export function hoursSince(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (Date.now() - d.getTime()) / 36e5;
}

export function freshnessOf(job: Pick<Job, "posted_at" | "first_seen_at">): Freshness {
  const h = hoursSince(jobDate(job));
  if (h < 24) return "hot";
  if (h < 72) return "fresh";
  if (h <= 120) return "ok";
  return "old";
}

export const FRESHNESS_LABEL: Record<Freshness, string> = {
  hot: "Hot",
  fresh: "Fresh",
  ok: "Recent",
  old: "Older",
};

export function timeAgo(date: Date | string) {
  const h = hoursSince(date);
  if (h < 1 / 60) return "just now";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min ago`;
  if (h < 24) return `${Math.round(h)} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

export function postedLabel(job: Pick<Job, "posted_at" | "first_seen_at">) {
  return job.posted_at ? `Posted ${timeAgo(job.posted_at)}` : `First seen ${timeAgo(job.first_seen_at)}`;
}

export function scoreBand(score: number | null | undefined) {
  if (score == null) return "none" as const;
  if (score >= 90) return "top" as const;
  if (score >= 75) return "good" as const;
  return "low" as const;
}

export function remoteLabel(r: Job["remote_type"]) {
  return { onsite: "On-site", hybrid: "Hybrid", remote: "Remote", unknown: "Work type not stated" }[r];
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Country tab a job belongs to. Remote jobs also show under the Remote tab. */
export function countryOf(job: Pick<Job, "country" | "city" | "location">) {
  const raw = `${job.country ?? ""} ${job.city ?? ""} ${job.location ?? ""}`.toLowerCase();
  if (/united arab emirates|uae|dubai|abu dhabi|sharjah/.test(raw)) return "Dubai / UAE";
  if (/united kingdom|uk|gb|england|scotland|wales|london|manchester|edinburgh|bristol|birmingham|leeds|nottingham/.test(raw)) return "UK";
  if (/india|bengaluru|bangalore|mumbai|pune|hyderabad|gurugram|gurgaon|noida|delhi|chennai/.test(raw)) return "India";
  if (/saudi|ksa|riyadh|jeddah|dammam/.test(raw)) return "Saudi Arabia";
  if (/qatar|doha/.test(raw)) return "Qatar";
  if (/singapore/.test(raw)) return "Singapore";
  if (/japan|tokyo|osaka|kyoto|fukuoka/.test(raw)) return "Japan";
  if (/luxembourg/.test(raw)) return "Luxembourg";
  if (/finland|helsinki|espoo|tampere|oulu/.test(raw)) return "Finland";
  if (/denmark|copenhagen|aarhus|odense/.test(raw)) return "Denmark";
  if (/sweden|stockholm|gothenburg|malm[oö]/.test(raw)) return "Sweden";
  if (/netherlands|holland|amsterdam|rotterdam|utrecht|eindhoven|the hague/.test(raw)) return "Netherlands";
  if (/germany|deutschland|berlin|munich|m[uü]nchen|hamburg|frankfurt|cologne|k[oö]ln|stuttgart/.test(raw)) return "Germany";
  if (/ireland|dublin|cork|galway/.test(raw)) return "Ireland";
  if (/canada|toronto|vancouver|montreal|ottawa|calgary/.test(raw)) return "Canada";
  if (/new zealand|auckland|wellington|christchurch/.test(raw)) return "New Zealand";
  if (/australia|sydney|melbourne|brisbane|perth|adelaide|canberra/.test(raw)) return "Australia";
  if (/europe|emea|eu|france|paris|spain|madrid|barcelona|portugal|lisbon|italy|milan|poland|warsaw|krak[oó]w|belgium|brussels|austria|vienna|switzerland|zurich|norway|oslo|czech|prague|estonia|tallinn|greece|athens|hungary|budapest|romania|bucharest/.test(raw)) return "Europe";
  return job.country?.trim() || "Not stated";
}

/** Each link the bots saved for a job, labelled by the site it came from. */
export function sourceLinks(job: Pick<Job, "urls" | "sources">) {
  const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return [...new Set(job.urls)].map((url) => {
    let host = url;
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* keep the raw string */
    }
    const named = job.sources.find((s) => compact(host).includes(compact(s).replace(/careers$/, "")));
    const ats = /greenhouse|lever\.co|ashbyhq/.test(host) ? job.sources.find((s) => s.endsWith("careers")) : undefined;
    return { url, label: named ?? ats ?? host };
  });
}
