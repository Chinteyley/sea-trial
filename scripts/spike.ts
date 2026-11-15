// Day-1 spike: trial one claim on one boat sandbox, with no context.dev or NYTE call, and time it.
// bun --env-file=.env.local scripts/spike.ts <page-url> "<claim quote>" "<how to check>"
import { runClaim } from "../src/lib/boat";
import type { Claim } from "../src/lib/types";

const [page, quote, check] = process.argv.slice(2);
if (!page || !quote || !check) {
  console.error('usage: bun --env-file=.env.local scripts/spike.ts <page-url> "<claim>" "<how to check>"');
  process.exit(1);
}

const claim: Claim = { id: "spike", title: "spike", quote, check, page, status: "queued", log: [] };
const started = Date.now();
const elapsed = () => `${((Date.now() - started) / 1000).toFixed(0)}s`.padStart(5);

const result = await runClaim(`spike-${Date.now().toString(36)}`, claim, {
  onSandbox: (id) => console.log(`${elapsed()}  sandbox ${id}`),
  onTrialing: () => console.log(`${elapsed()}  agent starts`),
  log: (text) => console.log(`${elapsed()}  ${text}`),
});
console.log(JSON.stringify(result, null, 2));
console.log(`total ${elapsed()}`);
