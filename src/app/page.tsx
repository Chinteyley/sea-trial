import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Masthead } from "@/components/Masthead";
import { StartTrialForm } from "@/components/StartTrialForm";
import { listTrials } from "@/lib/store";

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
        </section>

        <Suspense>
          <Logbook />
        </Suspense>
      </main>
    </>
  );
}

/** Past trials, read from disk on each request. */
async function Logbook() {
  await connection();
  const trials = listTrials();
  if (!trials.length) return null;
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
