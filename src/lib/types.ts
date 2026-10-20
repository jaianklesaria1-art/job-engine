export const JOB_STATUSES = [
  "found",
  "shortlisted",
  "applied",
  "contacted",
  "replied",
  "interview",
  "offer",
  "rejected",
  "skipped",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const STATUS_LABEL: Record<JobStatus, string> = {
  found: "Found",
  shortlisted: "Shortlisted",
  applied: "Applied",
  contacted: "Contacted",
  replied: "Replied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  skipped: "Skipped",
};

export type SponsorStatus = "confirmed" | "likely" | "not_stated" | "no" | "not_applicable";
export type RemoteType = "onsite" | "hybrid" | "remote" | "unknown";

export interface NewsItem {
  title: string;
  url?: string;
  date?: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  about: string | null;
  industry: string | null;
  size_label: string | null;
  headcount: number | null;
  funding_stage: string | null;
  investors: string | null;
  hq: string | null;
  india_offices: string | null;
  website: string | null;
  careers_url: string | null;
  design_team_count: number | null;
  news: NewsItem[];
  sponsor_status: SponsorStatus;
  sponsor_source: string | null;
  why_fit: string | null;
}

export interface GreenItem {
  id: string;
  keyword: string;
  line: string;
  points: number;
  source?: string;
}

export interface RedItem {
  keyword: string;
  note?: string;
}

export interface ScorePart {
  got: number;
  max: number;
}

export interface JobScore {
  job_id: string;
  score_now: number;
  score_possible: number;
  breakdown: Partial<Record<"skills" | "title" | "domain" | "keywords" | "location", ScorePart>>;
  green_items: GreenItem[];
  red_items: RedItem[];
  keywords: { keyword: string; present: boolean }[];
  ticked_items: string[];
  verdict: "apply" | "tailor" | "skip" | null;
  verdict_reason: string | null;
  tailored_cv_path: string | null;
}

export interface Job {
  id: string;
  company_id: string | null;
  company_name: string;
  title: string;
  title_group: string | null;
  seniority: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  remote_type: RemoteType;
  posted_at: string | null;
  first_seen_at: string;
  sources: string[];
  urls: string[];
  apply_url: string | null;
  description: string | null;
  salary_text: string | null;
  /** Closing date the advert states (YYYY-MM-DD). Missing until the jobs table has the column. */
  deadline?: string | null;
  deadline_source?: string | null;
  week_type: "A" | "B";
  status: JobStatus;
  status_changed_at: string;
  company: Company | null;
  score: JobScore | null;
}

export interface Contact {
  id: string;
  company_id: string | null;
  job_id: string | null;
  name: string;
  role: string | null;
  type: "hiring_manager" | "peer";
  email: string | null;
  email_status: "verified" | "accept_all" | "not_found" | "invalid";
  linkedin_url: string | null;
  linkedin_status: "not_sent" | "sent" | "accepted";
  linkedin_note: string | null;
  last_contacted_at: string | null;
  do_not_contact: boolean;
  source: string | null;
  created_at: string;
  company_name: string | null;
  job_title: string | null;
}

/** Statuses that mean Jai has applied and the job has moved on from the to-review list. */
export const APPLIED_STATUSES: JobStatus[] = ["applied", "contacted", "replied", "interview", "offer"];

export interface JobEvent {
  id: number;
  job_id: string;
  kind: string;
  detail: string | null;
  created_at: string;
}

export type BotName = "job_scout" | "contact_finder" | "outreach" | "inbox_tracker" | "request_checker";

export const BOT_LABEL: Record<BotName, string> = {
  job_scout: "Job Scout",
  contact_finder: "Contact Finder",
  outreach: "Outreach",
  inbox_tracker: "Inbox Tracker",
  request_checker: "Request Checker",
};

export interface Run {
  id: string;
  bot: BotName;
  status: "running" | "ok" | "error";
  started_at: string;
  finished_at: string | null;
  sources_checked: number | null;
  found: number | null;
  new_items: number | null;
  credits: { firecrawl_left?: number; hunter_used?: number; hunter_limit?: number };
  errors: string[];
  summary: string | null;
}

export interface Reply {
  id: string;
  contact_id: string | null;
  received_at: string;
  type: "positive" | "referral" | "not_hiring" | "not_interested" | "out_of_office" | "bounce" | "other";
  summary: string | null;
  seen: boolean;
  contact_name?: string | null;
  company_name?: string | null;
}

export interface Batch {
  id: string;
  status: "pending" | "approved" | "rejected" | "sent";
  email_count: number;
  created_at: string;
}

export interface Settings {
  week_type: "A" | "B";
  titles: string[];
  freshness_days: number;
  score_threshold: number;
  email_cap: number;
  warmup: boolean;
  contacts_hiring_managers: number;
  contacts_peers: number;
  notice_period: string;
  paused: boolean;
}

export type RequestKind = "run_now" | "tailor_cv" | "send_batch" | "find_contacts";

export interface BotRequest {
  id: string;
  kind: RequestKind;
  payload: Record<string, unknown>;
  status: "pending" | "done" | "error";
  result: Record<string, unknown> | null;
  created_at: string;
  done_at: string | null;
}

export const PHD_STATUSES = ["to_apply", "drafting", "ready", "applied", "interview", "offer", "rejected", "skipped"] as const;
export type PhdStatus = (typeof PHD_STATUSES)[number];

export const PHD_STATUS_LABEL: Record<PhdStatus, string> = {
  to_apply: "To apply",
  drafting: "Drafting",
  ready: "Ready to send",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  skipped: "Skipped",
};

export type PhdEligibility = "eligible" | "check" | "not_eligible";

export interface ProposalSection {
  heading: string;
  body: string;
}

export interface PhdPosition {
  id: string;
  title: string;
  university: string;
  group_name: string | null;
  supervisor: string | null;
  contact_email: string | null;
  city: string | null;
  country: string | null;
  url: string | null;
  post_url: string | null;
  deadline: string | null;
  start_date: string | null;
  funding: string | null;
  eligibility: string | null;
  eligibility_status: PhdEligibility;
  fit_reason: string | null;
  gaps: string[];
  checklist: { item: string; done: boolean }[];
  proposal: ProposalSection[];
  proposal_limit: string | null;
  status: PhdStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
