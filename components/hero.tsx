import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { Github } from "./github-icon";
import { Button } from "./ui/button";
import { VideoSlot } from "./video-slot";
import { site, TEST_COUNT } from "../lib/site";

const stack = ["Next.js 16", "TypeScript", "BullMQ", "Postgres", "Redis", "Groq + Gemini", "Docker", "CI/CD"];

/* Recruiter-first: one-line pitch, then the demo video immediately, then proof (stack, links). */
export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-10 sm:pt-12">
      <div className="grid-bg absolute inset-0 -z-10" />
      <div className="mx-auto max-w-3xl text-center">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 font-mono text-xs text-muted">
          <span className="size-2 rounded-full bg-good" /> Live in production · {TEST_COUNT} automated tests
        </p>
        <h1 className="mt-5 text-balance bg-gradient-to-b from-white to-white/55 bg-clip-text text-4xl font-semibold leading-[1.06] text-transparent sm:text-6xl">
          Every pull request, reviewed in seconds.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted sm:text-lg">
          A GitHub App where four AI agents review your code in parallel and post inline comments on the exact lines,
          backed by a queue, retries and deduplication.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-5xl">
        <VideoSlot id="demo" />
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <a href="https://github.com/apps/aicodereview001">
            <Github size={18} /> Install on GitHub
          </a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href={site.repoUrl} target="_blank" rel="noopener noreferrer">
            <Star size={16} /> View source code
          </a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/how-it-works">
            See how it works <ArrowRight size={16} />
          </Link>
        </Button>
      </div>

      <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2" aria-label="Tech stack">
        {stack.map((t) => (
          <li key={t} className="rounded-full border border-line bg-card px-3 py-1 font-mono text-xs text-muted">
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}
