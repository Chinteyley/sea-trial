import Link from "next/link";

export function Masthead() {
  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <Link href="/" className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={32} height={32} />
        <span className="font-display text-lg font-bold tracking-tight">
          Sea Trial
        </span>
      </Link>
      <div className="flex items-center gap-5 text-sm">
        <span className="hidden text-mist sm:inline">Proof, not pitch decks</span>
        <a
          href="https://github.com/Chinteyley/sea-trial"
          className="font-mono text-bone underline decoration-line underline-offset-4 hover:decoration-flag"
        >
          Source
        </a>
      </div>
    </header>
  );
}
