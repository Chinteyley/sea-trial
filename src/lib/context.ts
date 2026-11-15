// context.dev reads the startup: its brand for the report, and the claims a visitor can check in a browser.
import ContextDev from "context.dev";
import { z } from "zod";
import { env } from "./env";
import type { Trial } from "./types";

const ClaimsSchema = z.object({
  claims: z.array(
    z.object({
      title: z.string().describe("The capability in at most five words"),
      quote: z
        .string()
        .describe(
          "The sentence on the page that makes the claim, copied exactly",
        ),
      check: z
        .string()
        .describe(
          "Concrete steps a visitor can take in a browser to see whether the claim holds",
        ),
      testable_without_account: z
        .boolean()
        .describe(
          "True only if the check needs no sign-up, login, payment or personal data",
        ),
    }),
  ),
});

const INSTRUCTIONS = `List the product's capability claims that a visitor could check by actually using the product in a web browser: a free tool, demo, playground, search, calculator, converter, public docs or a public app.
Skip vague marketing ("fast", "loved by teams", "enterprise-grade") unless the page states something measurable a visitor can see.
Use only claims stated on the page. At most eight, strongest first.`;

// The context.dev plan runs one request at a time per organization, so every call waits its turn here.
let queue: Promise<unknown> = Promise.resolve();
function oneAtATime<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work, work);
  queue = result.catch(() => undefined);
  return result;
}

function client() {
  return new ContextDev({
    apiKey: env.contextKey(),
    timeout: 120_000,
    maxRetries: 1,
  });
}

export async function readBrand(domain: string): Promise<Trial["brand"]> {
  const response = await oneAtATime(() =>
    client().brand.retrieve({
      type: "by_domain",
      domain,
      timeoutOpts: { milliseconds: 60_000, behavior: "return-partial" },
    }),
  );
  const brand = response.brand;
  if (!brand) return undefined;
  const logo =
    brand.logos?.find((l) => l.type === "icon" && l.mode !== "light") ??
    brand.logos?.find((l) => l.type === "logo") ??
    brand.logos?.[0];
  return {
    title: brand.title ?? domain,
    description: brand.description ?? undefined,
    logo: logo?.url,
    color:
      brand.colors?.find((c) => c.source === "site")?.hex ??
      brand.colors?.[0]?.hex,
  };
}

export type ReadClaim = {
  title: string;
  quote: string;
  check: string;
  page: string;
};

export async function readClaims(url: string): Promise<ReadClaim[]> {
  const page = await oneAtATime(() =>
    client().web.scrape({
      url,
      formats: { json: true },
      jsonParams: {
        schema: z.toJSONSchema(ClaimsSchema),
        instructions: INSTRUCTIONS,
      },
    }),
  );
  if (!page.json.success)
    throw new Error(`context.dev could not read claims from ${url}`);
  const { claims } = ClaimsSchema.parse(page.json.data);
  return claims
    .filter((c) => c.testable_without_account)
    .slice(0, env.maxClaims)
    .map(({ title, quote, check }) => ({ title, quote, check, page: url }));
}
