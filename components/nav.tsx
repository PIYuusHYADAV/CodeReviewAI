"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/how-it-works?view=security", label: "Security" },
  { href: "/deployment", label: "Deployment" },
];

function NavInner() {
  const path = usePathname();
  const search = useSearchParams();
  const full = path + (search.get("view") === "security" ? "?view=security" : "");
  return (
    <header className="sticky top-3 z-50 mx-auto mt-3 flex w-[min(94%,960px)] items-center justify-between gap-2 rounded-full border border-line bg-card/80 px-3 py-2 backdrop-blur-xl sm:px-4">
      <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg" />
        <span className="hidden sm:inline">CodeReview AI</span>
      </Link>
      <nav className="flex gap-0.5 sm:gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-full px-2 py-1.5 text-xs transition-colors sm:px-4 sm:text-sm ${full === l.href ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Nav() {
  return (
    <Suspense fallback={null}>
      <NavInner />
    </Suspense>
  );
}
