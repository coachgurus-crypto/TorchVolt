import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-gold">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M13 2 4 14h7l-1 8 10-14h-7l0-6z" />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight text-navy">
        TorchVolt
      </span>
    </Link>
  );
}
