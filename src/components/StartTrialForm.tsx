"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartTrialForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const full = /^https?:\/\//.test(url) ? url : `https://${url}`;
    const response = await fetch("/api/trials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: full }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Could not start the trial");
      setPending(false);
      return;
    }
    router.push(`/trials/${body.id}`);
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="startup.com"
        aria-label="Startup URL"
        required
        className="h-14 flex-1 rounded-xl border border-line bg-hull px-5 text-lg text-bone placeholder:text-mist/60 outline-none focus:border-flag"
      />
      <button
        disabled={pending}
        className="h-14 rounded-xl bg-flag px-7 font-display text-lg font-bold text-hull transition-transform active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "Casting off…" : "Start sea trial"}
      </button>
      {error && <p className="text-failed sm:absolute sm:mt-16">{error}</p>}
    </form>
  );
}
