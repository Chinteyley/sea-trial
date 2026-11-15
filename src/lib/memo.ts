// NY Token Exchange writes the diligence memo on its confidential route and returns a signed inference receipt.
import { randomBytes } from "node:crypto";
import { env } from "./env";
import type { Trial } from "./types";

export async function writeMemo(
  trial: Trial,
): Promise<NonNullable<Trial["memo"]>> {
  const findings = trial.claims
    .map((c) => {
      const v = c.verdict;
      return `- Claim: "${c.quote}"\n  Verdict: ${v?.verdict ?? "not run"}${v ? `\n  Summary: ${v.summary}\n  Evidence: ${v.evidence.join("; ")}` : c.error ? `\n  Error: ${c.error}` : ""}`;
    })
    .join("\n");

  const body = JSON.stringify({
    model: env.nyteModel,
    messages: [
      {
        role: "system",
        content:
          "You write short diligence memos for early-stage investors. Plain prose, no hype. Report only what the evidence shows.",
      },
      {
        role: "user",
        content: `Sea trial of ${trial.brand?.title ?? trial.domain} (${trial.url}). Agents used the live product, one claim each, in separate machines, and recorded the screen.\n\n${findings}\n\nWrite the memo in under 150 words: a one-line verdict, what held up, what did not, and what to ask the founders.`,
      },
    ],
  });

  const response = await fetch(`${env.nyteBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.nyteKey()}`,
      "Content-Type": "application/json",
      // Opt in to a signed, offline-verifiable receipt over these exact request and response bytes.
      "x-inference-receipt": randomBytes(16).toString("hex"),
    },
    body,
  });
  if (!response.ok)
    throw new Error(
      `NYTE ${response.status}: ${(await response.text()).slice(0, 300)}`,
    );
  const json = (await response.json()) as {
    model?: string;
    trustedrouter?: { routing?: { selected_provider?: string } };
    choices: { message: { content: string } }[];
  };
  return {
    text: json.choices[0]?.message.content ?? "",
    model: json.model ?? env.nyteModel,
    provider: json.trustedrouter?.routing?.selected_provider,
    receipt: response.headers.get("x-inference-receipt") ?? undefined,
  };
}
