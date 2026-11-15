// boat.dev runs one claim: a sandbox of its own, Chrome on its desktop, an agent using the product, the screen recorded.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  BoatApi,
  Configuration,
  execCommand,
  readText,
  ResponseError,
  streamPrompt,
  waitForDesktop,
  waitUntilReady,
  type PromptRequestProviderEnum,
  type SandboxEvent,
} from "@boatdev/sdk";
import { z } from "zod";
import { env } from "./env";
import { DATA_DIR } from "./store";
import type { Claim, Verdict } from "./types";

const VIDEO_PATH = "/home/user/sea-trial.mp4";
const VERDICT_FILE = "verdict.json";

const VerdictSchema = z.object({
  verdict: z.enum(["verified", "partial", "failed", "untestable"]),
  summary: z.string(),
  evidence: z.array(z.string()).default([]),
});

export function boatApi(): BoatApi {
  return new BoatApi(
    new Configuration({
      basePath: "https://boat.dev/api/v1",
      accessToken: env.boatKey(),
    }),
  );
}

/** Single-quote a string for the sandbox shell. */
function sh(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

function surveyorPrompt(claim: Claim): string {
  return `You are a sea-trial surveyor checking one claim a startup makes about its product. Chrome is open on this computer's desktop at ${claim.page}.

Claim: "${claim.quote}"
How to check it: ${claim.check}

Use the product itself in that Chrome window through your computer tools: navigate, click, type and look at what happens. Reading the marketing copy is not evidence; what the product does when you use it is.

Rules:
- Never sign up, log in, enter payment details, or submit personal data. If the claim cannot be checked without that, the verdict is "untestable".
- Stay on the product's own site and anything it links to for the check.
- Work quickly: at most about 25 actions.

When you are done, write ${VERDICT_FILE} in your home directory with a shell command, as JSON:
{"verdict": "verified" | "partial" | "failed" | "untestable", "summary": "one sentence an investor can read", "evidence": ["what you did and what you saw", "..."]}
"verified" means you saw the product do what the claim says. "partial" means it did some of it. "failed" means you tried and it did not.
Then reply with the summary.`;
}

/** One readable line for the live log from an agent event, or nothing. */
function describe(event: SandboxEvent): string | undefined {
  if (event.type !== "response") return undefined;
  const data = event.data ?? {};
  const tools: unknown[] = Array.isArray(data.tools) ? data.tools : [];
  const names = tools
    .map((t) => (typeof t === "string" ? t : (t as { name?: string })?.name))
    .filter((n): n is string => Boolean(n))
    .map((n) => n.replace(/^mcp__computer__|^mcp:computer\//, ""));
  if (names.length) return names.join(" · ");
  if (typeof data.content === "string" && data.content.trim()) {
    return data.content.trim().replace(/\s+/g, " ").slice(0, 160);
  }
  return undefined;
}

type Report = {
  onSandbox: (sandboxId: string) => void;
  onTrialing: () => void;
  log: (text: string) => void;
};

export type ClaimResult = {
  verdict: { verdict: Verdict; summary: string; evidence: string[] };
  video?: string;
  costDollars?: number;
};

export async function runClaim(
  trialId: string,
  claim: Claim,
  report: Report,
): Promise<ClaimResult> {
  const boat = boatApi();
  const created = await boat.create({
    from: env.boatSnapshot,
    type: "default",
    ttlSeconds: (env.claimMinutes + 10) * 60,
    name: `sea-trial-${trialId}-${claim.id}`,
    labels: { app: "sea-trial", trial: trialId, claim: claim.id },
  });
  const sandboxId = created.sandbox.id;
  report.onSandbox(sandboxId);
  report.log(`boat sandbox ${sandboxId} created`);

  try {
    await waitUntilReady(boat, sandboxId, { timeoutMs: 240_000 });
    await waitForDesktop(boat, sandboxId, { timeoutMs: 240_000 });
    report.log("desktop up; recording");
    // The recorder starts first: started after Chrome, it records a blank desktop.
    await execCommand(
      boat,
      sandboxId,
      `ascii-record-desktop start ${VIDEO_PATH}`,
    );
    await execCommand(
      boat,
      sandboxId,
      // The "no" Google API keys hide Chrome's "Google API keys are missing" bar from the recording.
      // The agent starts once the window (titled "… - Chromium" on boat) is up and the page has had 2 s to paint.
      `DISPLAY=:0 GOOGLE_API_KEY=no GOOGLE_DEFAULT_CLIENT_ID=no GOOGLE_DEFAULT_CLIENT_SECRET=no nohup google-chrome-stable --no-first-run --no-default-browser-check --start-maximized ${sh(claim.page)} >/dev/null 2>&1 & for i in $(seq 40); do DISPLAY=:0 wmctrl -l | grep -q ' - Chromium$' && break; sleep 0.5; done; sleep 2`,
    );
    report.onTrialing();
    report.log(`Chrome open at ${claim.page}`);

    const events = streamPrompt(
      boat,
      sandboxId,
      {
        provider: env.boatProvider as PromptRequestProviderEnum,
        model: env.boatModel,
        prompt: surveyorPrompt(claim),
        _new: true,
      },
      { timeoutMs: env.claimMinutes * 60_000, intervalMs: 1500 },
    );
    for await (const event of events) {
      const line = describe(event);
      if (line) report.log(line);
    }

    await execCommand(boat, sandboxId, "ascii-record-desktop stop");
    const verdict = VerdictSchema.parse(
      JSON.parse(await readText(boat, sandboxId, VERDICT_FILE)),
    );
    report.log(`verdict: ${verdict.verdict}`);

    const video = await downloadVideo(boat, sandboxId, trialId, claim.id).catch(
      (error: unknown) => {
        report.log(
          `recording not saved: ${error instanceof Error ? error.message : String(error)}`,
        );
        return undefined;
      },
    );
    const usage = await boat.usage({ sandboxId }).catch(() => undefined);
    return { verdict, video, costDollars: usage?.dollars };
  } catch (error) {
    throw await readable(error);
  } finally {
    // Stopped, not deleted: the sandbox keeps its disk, so the next trial can resume it.
    await boat.stop({ sandboxId }).catch(() => undefined);
  }
}

/** The SDK's ResponseError hides boat's JSON body; surface its code and message, e.g. "409 provider_not_configured: ...". */
async function readable(error: unknown): Promise<unknown> {
  if (!(error instanceof ResponseError)) return error;
  const body = (await error.response.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
  };
  return new Error(
    `boat ${error.response.status} ${body.code ?? ""}: ${body.message ?? error.message}`,
  );
}

async function downloadVideo(
  boat: BoatApi,
  sandboxId: string,
  trialId: string,
  claimId: string,
) {
  const { url } = await boat.createDownloadUrl({
    sandboxId,
    path: VIDEO_PATH.replace("/home/user/", ""),
  });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`download ${response.status}`);
  const dir = join(DATA_DIR, "videos", trialId);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${claimId}.mp4`);
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  return `videos/${trialId}/${claimId}.mp4`;
}

/** A fresh desktop stream URL for the live wall. Asked for on each page load; it must be opened within 10 minutes. */
export async function desktopUrl(
  sandboxId: string,
): Promise<string | undefined> {
  const desktop = await boatApi().desktop({ sandboxId, theme: "dark" });
  if (!desktop.desktopUrl) return undefined;
  const [base, fragment] = desktop.desktopUrl.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}overlay=0${fragment ? `#${fragment}` : ""}`;
}
