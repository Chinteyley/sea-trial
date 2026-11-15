// Print the claims context.dev reads from each URL, without running any boat.
// bun --env-file=.env.local scripts/claims.ts <url> [url...]
import { readBrand, readClaims } from "../src/lib/context";

await Promise.all(
  process.argv.slice(2).map(async (url) => {
    const started = Date.now();
    try {
      const [brand, claims] = await Promise.all([
        readBrand(new URL(url).hostname.replace(/^www\./, "")).catch((e) => `brand error: ${e.message}`),
        readClaims(url),
      ]);
      console.log(`\n## ${url} (${((Date.now() - started) / 1000).toFixed(0)}s)`, JSON.stringify(brand).slice(0, 200));
      for (const c of claims) console.log(`- ${c.title}: "${c.quote}"\n    check: ${c.check}`);
    } catch (e) {
      console.log(`\n## ${url} ERROR ${(e as Error).message.slice(0, 300)}`);
    }
  }),
);
