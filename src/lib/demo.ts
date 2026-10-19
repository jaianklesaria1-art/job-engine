// Preview data for ?demo=1. Every company is fictional and labelled "Sample" so it can't be mistaken for a real job.
import type { Batch, Company, Job, JobEvent, JobScore, PhdPosition, Reply, Run, Settings } from "@/lib/types";

const hoursAgo = (h: number) => new Date(Date.now() - h * 36e5).toISOString();

function company(id: string, name: string, extra: Partial<Company> = {}): Company {
  return {
    id,
    name,
    domain: null,
    about: "Fictional company used to preview the dashboard.",
    industry: null,
    size_label: null,
    headcount: null,
    funding_stage: null,
    investors: null,
    hq: null,
    india_offices: null,
    website: null,
    careers_url: null,
    design_team_count: null,
    news: [],
    sponsor_status: "not_applicable",
    sponsor_source: null,
    why_fit: null,
    ...extra,
  };
}

const companies = {
  pay: company("c1", "Sample Payments Co", {
    industry: "Fintech",
    size_label: "1,000 to 5,000",
    funding_stage: "Series D",
    hq: "Bengaluru",
    india_offices: "Bengaluru, Mumbai",
    design_team_count: 24,
    why_fit: "Sample reason. The real one comes from your experience bank.",
    news: [{ title: "Sample: launched a new merchant app", date: "2026-10-10" }],
  }),
  health: company("c2", "Sample Health Tech", {
    industry: "Healthcare",
    size_label: "200 to 500",
    funding_stage: "Series B",
    hq: "Mumbai",
    india_offices: "Mumbai",
    design_team_count: 6,
    why_fit: "Sample reason. The real one comes from your experience bank.",
  }),
  logi: company("c3", "Sample Logistics", {
    industry: "Logistics",
    size_label: "500 to 1,000",
    funding_stage: "Series C",
    hq: "Pune",
    design_team_count: 9,
    why_fit: "Sample reason. The real one comes from your experience bank.",
  }),
  saas: company("c4", "Sample SaaS Studio", {
    industry: "B2B SaaS",
    size_label: "50 to 200",
    funding_stage: "Seed",
    hq: "Remote",
    design_team_count: 3,
  }),
  uk: company("c5", "Sample UK Fintech", {
    industry: "Fintech",
    size_label: "200 to 500",
    hq: "London",
    sponsor_status: "confirmed",
    sponsor_source: "UK Register of Licensed Sponsors (sample)",
  }),
};

function score(job_id: string, now: number, possible: number, extra: Partial<JobScore> = {}): JobScore {
  return {
    job_id,
    score_now: now,
    score_possible: possible,
    breakdown: {
      skills: { got: Math.round(now * 0.4), max: 40 },
      title: { got: 13, max: 15 },
      domain: { got: 11, max: 15 },
      keywords: { got: 10, max: 15 },
      location: { got: 14, max: 15 },
    },
    green_items: [],
    red_items: [],
    keywords: [],
    ticked_items: [],
    verdict: possible >= 90 ? "apply" : possible >= 75 ? "tailor" : "skip",
    verdict_reason: null,
    tailored_cv_path: null,
    ...extra,
  };
}

function job(
  id: string,
  title: string,
  c: Company,
  hours: number,
  s: JobScore | null,
  extra: Partial<Job> = {},
): Job {
  return {
    id,
    company_id: c.id,
    company_name: c.name,
    title,
    title_group: title,
    seniority: "mid",
    location: c.hq,
    city: c.hq,
    country: "India",
    remote_type: "hybrid",
    posted_at: hoursAgo(hours),
    first_seen_at: hoursAgo(Math.max(0, hours - 1)),
    sources: ["Sample source"],
    urls: ["https://example.com/sample-job-post"],
    apply_url: null,
    description:
      "Sample job description. We're looking for a designer who can run user research, turn findings into flows and prototypes in Figma, and work closely with engineers. Experience with design systems, usability testing and analytics tools is a plus.",
    salary_text: null,
    week_type: "A",
    status: "found",
    status_changed_at: hoursAgo(hours),
    company: c,
    score: s,
    ...extra,
  };
}

export function demoData() {
  const jobs: Job[] = [
    job(
      "j1",
      "Product Designer",
      companies.pay,
      5,
      score("j1", 82, 91, {
        green_items: [
          { id: "g1", keyword: "Design systems", line: "Sample line. Real lines are copied from your experience bank, never written fresh.", points: 4 },
          { id: "g2", keyword: "A/B testing", line: "Sample line. Only shows if the experience bank has a true A/B testing example.", points: 3 },
          { id: "g3", keyword: "Stakeholder management", line: "Sample line. Real lines are copied from your experience bank, never written fresh.", points: 2 },
        ],
        red_items: [{ keyword: "Mixpanel funnels", note: "Not in your experience bank" }, { keyword: "Payments domain" }],
        keywords: [
          { keyword: "Figma", present: true },
          { keyword: "User research", present: true },
          { keyword: "Design systems", present: false },
          { keyword: "A/B testing", present: false },
          { keyword: "Prototyping", present: true },
          { keyword: "Mixpanel", present: false },
        ],
        verdict_reason: "Sample verdict reason.",
      }),
      { sources: ["Sample source", "Company site"] },
    ),
    job("j2", "UX Researcher", companies.health, 14, score("j2", 88, 94), { remote_type: "remote" }),
    job("j3", "UX Designer", companies.logi, 30, score("j3", 76, 84)),
    job("j4", "UX/UI Designer", companies.saas, 50, score("j4", 64, 72), { remote_type: "remote", country: "Remote" }),
    job("j5", "Product Designer", companies.uk, 20, score("j5", 79, 88), { week_type: "B", country: "UK", city: "London", location: "London", remote_type: "hybrid", deadline: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10), deadline_source: "Sample closing date" }),
    job("j6", "UX Analyst", companies.pay, 70, score("j6", 81, 86), { status: "shortlisted" }),
    job("j7", "AI Product Designer", companies.saas, 96, score("j7", 77, 89), { status: "applied", remote_type: "remote" }),
    job("j8", "UX Engineer", companies.logi, 110, score("j8", 58, 66), { status: "skipped" }),
  ];

  const runs: Run[] = [
    { id: "r1", bot: "job_scout", status: "ok", started_at: hoursAgo(2.1), finished_at: hoursAgo(2), sources_checked: 34, found: 41, new_items: 8, credits: { firecrawl_left: 512 }, errors: [], summary: "Sample run" },
    { id: "r2", bot: "contact_finder", status: "ok", started_at: hoursAgo(1.6), finished_at: hoursAgo(1.5), sources_checked: null, found: 6, new_items: 6, credits: { hunter_used: 7, hunter_limit: 50 }, errors: [], summary: null },
  ];

  const replies: Reply[] = [
    { id: "p1", contact_id: null, received_at: hoursAgo(3), type: "positive", summary: "Sample: happy to chat on Thursday about the Product Designer role.", seen: false, contact_name: "Sample Contact", company_name: companies.pay.name },
  ];

  const batches: Batch[] = [{ id: "b1", status: "pending", email_count: 6, created_at: hoursAgo(1) }];

  const events: JobEvent[] = [
    { id: 1, job_id: "j1", kind: "found", detail: "Found on Sample source", created_at: hoursAgo(4) },
    { id: 2, job_id: "j1", kind: "score", detail: "CV scored 82 (91 possible)", created_at: hoursAgo(4) },
  ];

  const settings: Settings = {
    week_type: "A",
    titles: ["Product Designer", "UX Designer", "UX/UI Designer", "UX Analyst", "UX Researcher", "AI Product Designer", "UX Engineer"],
    freshness_days: 5,
    score_threshold: 75,
    email_cap: 10,
    warmup: true,
    contacts_hiring_managers: 2,
    contacts_peers: 2,
    notice_period: "1 month",
    paused: false,
  };

  return { jobs, runs, replies, batches, events, settings, linkedinToSend: 4 };
}

export function demoPhds(): PhdPosition[] {
  const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
  return [
    {
      id: "demo-phd-1",
      title: "PhD in Sample Interaction Design",
      university: "Sample University",
      group_name: "Sample HCI Lab",
      supervisor: "Dr Sample",
      contact_email: null,
      city: "Sampletown",
      country: "Nowhere",
      url: null,
      post_url: null,
      deadline: inDays(26),
      start_date: "Spring 2027",
      funding: "Sample funding text",
      eligibility: "Sample eligibility text. Preview only.",
      eligibility_status: "check",
      fit_reason: "Preview row so the layout can be checked. Not a real position.",
      gaps: ["Sample gap"],
      checklist: [
        { item: "CV", done: true },
        { item: "Proposal", done: false },
      ],
      proposal: [
        { heading: "Working title", body: "Sample title" },
        { heading: "Research question", body: "Sample question" },
      ],
      proposal_limit: "2 pages",
      status: "drafting",
      notes: null,
      created_at: hoursAgo(5),
      updated_at: hoursAgo(1),
    },
  ];
}
