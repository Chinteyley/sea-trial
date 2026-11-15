import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Masthead } from "@/components/Masthead";
import { StartTrialForm } from "@/components/StartTrialForm";
import { VERDICT_STYLE } from "@/components/verdict";
import { env } from "@/lib/env";
import { listTrials } from "@/lib/store";
import type { Trial, Verdict } from "@/lib/types";

export default function Home() {
  return (
    <>
      <Masthead />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 pb-20 pt-16 sm:px-10">
        <section className="flex flex-col gap-6">
          <p className="font-mono text-sm uppercase tracking-widest text-flag">
            Diligence with video proof
          </p>
          <h1 className="max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            You&apos;d never buy a boat without a sea trial.
          </h1>
          <p className="max-w-2xl text-lg text-mist">
            Paste a startup&apos;s site. Sea Trial reads what it claims, gives
            every claim its own machine, and an agent uses the real product
            while the screen records. You get a verdict per claim and the
            footage to back it.
          </p>
          <StartTrialForm />
          {env.dailyTrials > 0 && (
            <p className="font-mono text-sm text-mist">
              One trial at a time, {env.dailyTrials} a day, up to{" "}
              {env.maxClaims} claims each. A trial takes a few minutes.
            </p>
          )}
        </section>

        <Suspense>
          <Logbook />
        </Suspense>
      </main>
    </>
  );
}

/** Finished trials first, as examples, then every other trial, read from disk on each request. */
async function Logbook() {
  await connection();
  const all = listTrials();
  const featured = env.featuredTrials
    .map((id) => all.find((t) => t.id === id))
    .filter((t): t is Trial => Boolean(t));
  const trials = all.filter((t) => !featured.includes(t));
  return (
    <>
      {featured.length > 0 && <Featured trials={featured} />}
      {trials.length > 0 && <Recent trials={trials} />}
    </>
  );
}

function Featured({ trials }: { trials: Trial[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-bold">Finished sea trials</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {trials.map((t) => {
          // The headline is the first claim that did not hold up, else the first that did.
          const lead =
            t.claims.find(
              (c) => c.verdict && c.verdict.verdict !== "verified",
            ) ?? t.claims.find((c) => c.verdict);
          return (
            <Link
              key={t.id}
              href={`/trials/${t.id}`}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-hull p-6 transition-colors hover:border-flag"
            >
              <div className="flex items-center gap-3">
                {t.brand?.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.brand.logo}
                    alt=""
                    className="h-10 w-10 rounded-lg bg-bone object-contain p-1"
                  />
                )}
                <div>
                  <p className="font-display text-lg font-bold">
                    {t.brand?.title ?? t.domain}
                  </p>
                  <p className="font-mono text-xs text-mist">{t.domain}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-display font-bold">
                {(Object.keys(VERDICT_STYLE) as Verdict[]).map((v) => {
                  const n = t.claims.filter(
                    (c) => c.verdict?.verdict === v,
                  ).length;
                  return n ? (
                    <span key={v} className={VERDICT_STYLE[v].text}>
                      {n} {VERDICT_STYLE[v].label.toLowerCase()}
                    </span>
                  ) : null;
                })}
              </div>
              {lead?.verdict && (
                <p className="text-[15px] leading-relaxed text-bone">
                  {lead.verdict.summary}
                </p>
              )}
              <span className="mt-auto font-mono text-sm text-flag">
                Watch the boats →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Recent({ trials }: { trials: Trial[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-bold">Logbook</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-hull">
        {trials.map((t) => {
          const verified = t.claims.filter(
            (c) => c.verdict?.verdict === "verified",
          ).length;
          return (
            <li key={t.id}>
              <Link
                href={`/trials/${t.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-deck"
              >
                <span className="font-medium">
                  {t.brand?.title ?? t.domain}
                </span>
                <span className="font-mono text-sm text-mist">
                  {t.status === "done"
                    ? `${verified}/${t.claims.length} verified`
                    : t.status}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
