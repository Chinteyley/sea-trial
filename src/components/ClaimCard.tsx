import type { Claim } from "@/lib/types";
import { DesktopFrame, Placeholder } from "./DesktopFrame";
import { VERDICT_STYLE } from "./verdict";

export function ClaimCard({
  trialId,
  claim,
  index,
}: {
  trialId: string;
  claim: Claim;
  index: number;
}) {
  const verdict = claim.verdict && VERDICT_STYLE[claim.verdict.verdict];
  const live =
    (claim.status === "boarding" || claim.status === "trialing") &&
    claim.sandboxId;
  const recent = claim.log.slice(-4);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-hull ${verdict ? verdict.ring : "border-line"}`}
    >
      <div className="relative aspect-video w-full bg-sea">
        {claim.video ? (
          <video
            src={`/api/trials/${trialId}/video/${claim.id}`}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        ) : live ? (
          <DesktopFrame trialId={trialId} claimId={claim.id} />
        ) : (
          <Placeholder
            text={
              claim.status === "queued"
                ? "Waiting for a boat"
                : claim.status === "error"
                  ? "Run failed"
                  : "Trial complete"
            }
          />
        )}
        {verdict && (
          <span
            className={`absolute right-3 top-3 rounded-md border-2 bg-sea/85 px-3 py-1 font-display text-sm font-bold uppercase tracking-wider ${verdict.ring} ${verdict.text}`}
          >
            {verdict.label}
          </span>
        )}
        {live && (
          <span className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-sea/85 px-2.5 py-1 font-mono text-xs text-bone">
            <span className="h-2 w-2 animate-pulse rounded-full bg-failed" />{" "}
            LIVE
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-bold">
            <span className="mr-2 font-mono text-sm text-flag">
              {String(index + 1).padStart(2, "0")}
            </span>
            {claim.title}
          </h3>
          {claim.costDollars !== undefined && (
            <span className="font-mono text-xs text-mist">
              ${claim.costDollars.toFixed(3)}
            </span>
          )}
        </div>
        <blockquote className="border-l-2 border-line pl-3 text-sm text-mist">
          “{claim.quote}”
        </blockquote>
        {claim.verdict ? (
          <p className="text-[15px] leading-relaxed">{claim.verdict.summary}</p>
        ) : claim.error ? (
          <p className="text-sm text-failed">{claim.error}</p>
        ) : (
          <ol className="flex flex-col gap-1 font-mono text-xs text-mist">
            {recent.length ? (
              recent.map((l) => (
                <li key={l.at + l.text} className="truncate">
                  › {l.text}
                </li>
              ))
            ) : (
              <li>› {claim.status}</li>
            )}
          </ol>
        )}
      </div>
    </article>
  );
}
