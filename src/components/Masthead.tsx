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
      <span className="text-sm text-mist">Proof, not pitch decks</span>
    </header>
  );
}
