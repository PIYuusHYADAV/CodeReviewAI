"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";

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
    <header className="sticky top-3 z-50 mx-auto mt-3 flex w-[min(94%,960px)] items-center justify-between rounded-full border border-line bg-card/80 px-4 py-2 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="" width={32} height={32} className="size-8 rounded-lg" />
        CodeReview AI
      </Link>
      <nav className="flex gap-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="relative rounded-full px-4 py-1.5 text-sm text-muted hover:text-ink">
            {full === l.href && (
              <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-brand-soft" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
            )}
            <span className={`relative ${full === l.href ? "text-brand" : ""}`}>{l.label}</span>
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
