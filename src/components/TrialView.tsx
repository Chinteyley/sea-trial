"use client";

import { useEffect, useState } from "react";
import type { Trial } from "@/lib/types";
import { ClaimCard } from "./ClaimCard";
import { VERDICT_STYLE } from "./verdict";

const STATUS_LINE: Record<Trial["status"], string> = {
  reading: "Reading the site with context.dev…",
  trialing: "Trialing every claim on its own boat…",
  writing: "Writing the memo on NYTE's confidential route…",
  done: "Trial complete",
  error: "Trial stopped",
};

export function TrialView({ initial }: { initial: Trial }) {
  const [trial, setTrial] = useState(initial);
  const finished = trial.status === "done" || trial.status === "error";

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/trials/${trial.id}`);
      if (response.ok) setTrial(await response.json());
    }, 1500);
    return () => clearInterval(timer);
  }, [trial.id, finished]);

  const tally = (["verified", "partial", "failed", "untestable"] as const)
    .map((v) => ({
      v,
      n: trial.claims.filter((c) => c.verdict?.verdict === v).length,
    }))
    .filter((t) => t.n > 0);
  const cost = trial.claims.reduce((sum, c) => sum + (c.costDollars ?? 0), 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 pb-20 pt-8 sm:px-10">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          {trial.brand?.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trial.brand.logo}
              alt=""
              className="h-14 w-14 rounded-xl bg-bone object-contain p-1.5"
            />
          )}
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              {trial.brand?.title ?? trial.domain}
            </h1>
            <p className="font-mono text-sm text-mist">{trial.url}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p
            className={`font-mono text-sm ${trial.status === "error" ? "text-failed" : "text-flag"}`}
          >
            {STATUS_LINE[trial.status]}
          </p>
          <p className="flex gap-4 font-display text-lg font-bold">
            {tally.map(({ v, n }) => (
              <span key={v} className={VERDICT_STYLE[v].text}>
                {n} {VERDICT_STYLE[v].label.toLowerCase()}
              </span>
            ))}
            {cost > 0 && (
              <span className="text-mist">${cost.toFixed(2)} compute</span>
            )}
          </p>
        </div>
      </section>

      {trial.error && (
        <p className="rounded-xl border border-failed/60 bg-hull p-4 text-failed">
          {trial.error}
        </p>
      )}

      {trial.claims.length > 0 && (
        <section className="grid gap-6 md:grid-cols-2">
          {trial.claims.map((claim, i) => (
            <ClaimCard
              key={claim.id}
              trialId={trial.id}
              claim={claim}
              index={i}
            />
          ))}
        </section>
      )}

      {trial.memo && (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-hull p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">Diligence memo</h2>
            <span className="font-mono text-xs text-mist">
              {trial.memo.model}
              {trial.memo.provider ? ` · ${trial.memo.provider}` : ""}
            </span>
          </div>
          <p className="max-w-3xl whitespace-pre-wrap text-[17px] leading-relaxed">
            {trial.memo.text}
          </p>
          {trial.memo.receipt && (
            <p className="flex items-center gap-2 font-mono text-xs text-verified">
              ✓ Signed inference receipt
              <span className="truncate text-mist">
                {trial.memo.receipt.slice(0, 48)}…
              </span>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
