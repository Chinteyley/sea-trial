// Runs a sea trial end to end: read the claims, trial each one in its own sandbox, write the memo.
import { randomUUID } from "node:crypto";
import { runClaim } from "./boat";
import { readBrand, readClaims } from "./context";
import { env } from "./env";
import { writeMemo } from "./memo";
import { getTrial, saveTrial, updateClaim, updateTrial } from "./store";
import type { Claim, Trial } from "./types";

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function startTrial(url: string): Trial {
  const parsed = new URL(url);
  const trial: Trial = {
    id: randomUUID().slice(0, 8),
    url: parsed.toString(),
    domain: parsed.hostname.replace(/^www\./, ""),
    createdAt: Date.now(),
    status: "reading",
    claims: [],
  };
  saveTrial(trial);
  void run(trial.id);
  return trial;
}

async function run(id: string): Promise<void> {
  try {
    const trial = getTrial(id)!;
    const [brand, claims] = await Promise.all([
      readBrand(trial.domain).catch(() => undefined),
      readClaims(trial.url),
    ]);
    if (!claims.length)
      throw new Error("no claims a visitor can check without an account");
    updateTrial(id, (t) => {
      t.brand = brand;
      t.claims = claims.map((c, i): Claim => ({
        ...c,
        id: `c${i + 1}`,
        status: "queued",
        log: [],
      }));
      t.status = "trialing";
    });

    await eachLimited(getTrial(id)!.claims, env.maxParallel, (claim) =>
      trialClaim(id, claim),
    );

    updateTrial(id, (t) => (t.status = "writing"));
    const memo = await writeMemo(getTrial(id)!);
    updateTrial(id, (t) => {
      t.memo = memo;
      t.status = "done";
    });
  } catch (error) {
    updateTrial(id, (t) => {
      t.status = "error";
      t.error = message(error);
    });
  }
}

async function trialClaim(trialId: string, claim: Claim): Promise<void> {
  const set = (change: (c: Claim) => void) =>
    updateClaim(trialId, claim.id, change);
  set((c) => {
    c.status = "boarding";
    c.startedAt = Date.now();
  });
  try {
    const result = await runClaim(trialId, claim, {
      onSandbox: (sandboxId) => set((c) => (c.sandboxId = sandboxId)),
      onTrialing: () => set((c) => (c.status = "trialing")),
      log: (text) => set((c) => c.log.push({ at: Date.now(), text })),
    });
    set((c) => {
      c.status = "done";
      c.verdict = result.verdict;
      c.video = result.video;
      c.costDollars = result.costDollars;
      c.endedAt = Date.now();
    });
  } catch (error) {
    set((c) => {
      c.status = "error";
      c.error = message(error);
      c.endedAt = Date.now();
    });
  }
}

/** Run `work` over `items` with at most `limit` running at once. */
async function eachLimited<T>(
  items: T[],
  limit: number,
  work: (item: T) => Promise<void>,
) {
  let next = 0;
  const lanes = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (next < items.length) await work(items[next++]);
    },
  );
  await Promise.all(lanes);
}
