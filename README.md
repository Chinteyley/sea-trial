# Sea Trial

You'd never buy a boat without a sea trial. Don't fund a startup on its pitch deck.

_Shipped aboard a boat: this line was committed and pushed from inside a boat.dev sandbox._

_And this one from a real boat: shipped mid-crossing on the Koh Pich ⇄ Chroy Changvar ferry, Phnom Penh._

Paste a startup's URL. Sea Trial reads the claims on its site with [context.dev](https://www.context.dev), gives each claim its own [boat.dev](https://boat.dev) sandbox, and has an agent use the real product in Chrome on that sandbox's desktop while the screen records. Each claim comes back verified, partial, failed or untestable, with the recording as proof. [NY Token Exchange](https://nytokenexchange.com) writes the diligence memo on its confidential route and returns a signed inference receipt.

## Run

```bash
bun install
cp .env.example .env.local   # fill in the keys
bun run dev
```

Before the first trial:

- **boat.dev:** a plan or the trial (`boat billing plan`). Create an API key that can create sandboxes:

  ```bash
  boat api-key create sea-trial --actions sandbox.create,sandbox.read,sandbox.update,sandbox.stop,agent.prompt,exec,file.read,file.write,desktop,host,snapshot.read,snapshot.write,account.read
  ```

  Then connect a Claude or ChatGPT subscription on [Agents & Proxying](https://boat.dev/dashboard?tab=agents).
- **context.dev** and **NYTE** keys go in `.env.local`.

Time a single claim on a single boat, without context.dev or NYTE:

```bash
bun --env-file=.env.local scripts/spike.ts https://example.com "The page shows a title" "Open the page and read the heading"
```

Print the claims context.dev reads from a site, without running a boat:

```bash
bun --env-file=.env.local scripts/claims.ts https://excalidraw.com
```

## How it works

| Step | Code |
| --- | --- |
| Read the brand and the claims a visitor can check without an account | `src/lib/context.ts` |
| One sandbox per claim: desktop, recording, Chrome, `boat prompt`, `verdict.json`, MP4 | `src/lib/boat.ts` |
| Run the claims at most `MAX_PARALLEL` at a time, then write the memo | `src/lib/trial.ts` |
| Memo on `trustedrouter/confidential` with `x-inference-receipt` | `src/lib/memo.ts` |
| Live wall: embedded desktops while trialing, recordings and verdicts after | `src/components/TrialView.tsx` |

Trials and recordings are kept in `data/`. Each sandbox is stopped, not deleted, after its claim, so it keeps its disk and can be resumed for the next trial.
