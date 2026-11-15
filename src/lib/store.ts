// Trials live in memory while the server runs and are written to data/trials/<id>.json on every change.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Claim, Trial } from "./types";

export const DATA_DIR = join(process.cwd(), "data");
const TRIALS_DIR = join(DATA_DIR, "trials");

const globalStore = globalThis as unknown as { __trials?: Map<string, Trial> };

function trials(): Map<string, Trial> {
  if (!globalStore.__trials) {
    mkdirSync(TRIALS_DIR, { recursive: true });
    const map = new Map<string, Trial>();
    for (const file of readdirSync(TRIALS_DIR)) {
      if (!file.endsWith(".json")) continue;
      const trial = JSON.parse(
        readFileSync(join(TRIALS_DIR, file), "utf8"),
      ) as Trial;
      map.set(trial.id, trial);
    }
    globalStore.__trials = map;
  }
  return globalStore.__trials;
}

export function listTrials(): Trial[] {
  return [...trials().values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getTrial(id: string): Trial | undefined {
  return trials().get(id);
}

export function saveTrial(trial: Trial): void {
  trials().set(trial.id, trial);
  writeFileSync(
    join(TRIALS_DIR, `${trial.id}.json`),
    JSON.stringify(trial, null, 2),
  );
}

/** Change a trial and persist it. */
export function updateTrial(id: string, change: (trial: Trial) => void): Trial {
  const trial = trials().get(id);
  if (!trial) throw new Error(`no trial ${id}`);
  change(trial);
  saveTrial(trial);
  return trial;
}

export function updateClaim(
  trialId: string,
  claimId: string,
  change: (claim: Claim) => void,
): void {
  updateTrial(trialId, (trial) => {
    const claim = trial.claims.find((c) => c.id === claimId);
    if (claim) change(claim);
  });
}
