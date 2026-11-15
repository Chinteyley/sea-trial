"use client";

import { useEffect, useState } from "react";

/** The claim's live boat desktop. The stream URL is short-lived, so it is asked for when this mounts. */
export function DesktopFrame({
  trialId,
  claimId,
}: {
  trialId: string;
  claimId: string;
}) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      const response = await fetch(`/api/trials/${trialId}/desktop/${claimId}`);
      const body = (await response.json()) as { url?: string };
      if (cancelled) return;
      if (body.url) setUrl(body.url);
      else timer = setTimeout(load, 5000);
    }
    void load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trialId, claimId]);

  if (!url) return <Placeholder text="Boarding the boat…" />;
  return (
    <iframe
      src={url}
      title="Live boat desktop"
      allow="autoplay; fullscreen"
      className="h-full w-full border-0 pointer-events-none"
    />
  );
}

export function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-deck font-mono text-sm text-mist">
      {text}
    </div>
  );
}
