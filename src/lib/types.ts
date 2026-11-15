// The shape of a sea trial, shared by the server runner and the live page.

export type Verdict = "verified" | "partial" | "failed" | "untestable";

export type ClaimStatus = "queued" | "boarding" | "trialing" | "done" | "error";

export type LogLine = { at: number; text: string };

export type Claim = {
  id: string;
  title: string;
  /** The sentence on the startup's site that makes the claim. */
  quote: string;
  page: string;
  /** How a visitor checks it in a browser, without an account. */
  check: string;
  status: ClaimStatus;
  sandboxId?: string;
  startedAt?: number;
  endedAt?: number;
  verdict?: { verdict: Verdict; summary: string; evidence: string[] };
  error?: string;
  /** Path of the recorded desktop MP4 under data/, once downloaded. */
  video?: string;
  costDollars?: number;
  log: LogLine[];
};

export type TrialStatus = "reading" | "trialing" | "writing" | "done" | "error";

export type Trial = {
  id: string;
  url: string;
  domain: string;
  createdAt: number;
  status: TrialStatus;
  error?: string;
  brand?: {
    title: string;
    description?: string;
    logo?: string;
    color?: string;
  };
  claims: Claim[];
  memo?: { text: string; model: string; provider?: string; receipt?: string };
};
