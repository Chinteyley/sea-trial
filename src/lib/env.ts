// Server configuration, read once. Missing keys fail at the step that needs them, with the variable named.

function need(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see .env.example)`);
  return value;
}

export const env = {
  boatKey: () => need("BOAT_API_KEY"),
  contextKey: () => need("CONTEXT_DEV_API_KEY"),
  nyteKey: () => need("NYTE_API_KEY"),
  nyteBaseUrl: process.env.NYTE_BASE_URL ?? "https://api.trustedrouter.com/v1",
  nyteModel: process.env.NYTE_MODEL ?? "trustedrouter/confidential",
  /** Harness for `boat prompt`; needs a key or subscription on boat's Agents & Proxying page. */
  boatProvider: process.env.BOAT_PROVIDER ?? "claude",
  /** Model the harness runs; empty means the harness default. */
  boatModel: process.env.BOAT_MODEL || undefined,
  /** Optional saved snapshot to start each claim's sandbox from. */
  boatSnapshot: process.env.BOAT_SNAPSHOT || undefined,
  /** The boat trial allows 2 sandboxes at once; the $20 plan allows 100. */
  maxParallel: Number(process.env.MAX_PARALLEL ?? 2),
  maxClaims: Number(process.env.MAX_CLAIMS ?? 4),
  /** Minutes an agent gets per claim before the trial calls it. */
  claimMinutes: Number(process.env.CLAIM_MINUTES ?? 8),
};
