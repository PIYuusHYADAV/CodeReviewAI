"use client";
import Link from "next/link";
import { ArrowRight, GitPullRequest, Layers, ListChecks, ShieldCheck, RefreshCcw, Zap } from "lucide-react";

import { Reveal, Stagger } from "./reveal";
import { Counter } from "./counter";

const stats = [
  { to: 4, label: "AI agents in parallel" },
  { to: 4, label: "security layers before any AI runs" },
  { to: 5, label: "automatic retries" },
  { to: 24, suffix: "h", label: "smart result cache" },
];

const steps = [
  { icon: GitPullRequest, t: "Open a pull request", d: "A signed webhook tells the app. Nothing else to configure." },
  { icon: Layers, t: "Four agents read it", d: "Security, performance, style and architecture, in parallel on a queue." },
  { icon: ListChecks, t: "Findings land on your lines", d: "Inline comments, a scored summary and a pass/fail check." },
];

const pillars = [
  { icon: ShieldCheck, t: "Secure by default", d: "Signed webhooks, event filtering, rate limits and deduplication guard every request." },
  { icon: RefreshCcw, t: "Fault tolerant", d: "Retries with backoff, self-healing stuck jobs and failures that stay contained." },
  { icon: Zap, t: "Fast and frugal", d: "Instant replies, a separate worker, and identical code is never reviewed twice." },
];

export function HomeSections() {
  return (
    <div className="space-y-36 px-6 pb-12">
      <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4" aria-label="At a glance">
        {stats.map((s, i) => (
          <li key={s.label}>
            <Reveal delay={i * 0.08} className="h-full">
              <div className="h-full rounded-2xl border border-line bg-card p-6 text-center">
                <p className="font-display text-5xl font-semibold text-brand"><Counter to={s.to} suffix={s.suffix} /></p>
                <p className="mt-2 text-sm text-muted">{s.label}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>

      <section className="mx-auto max-w-5xl">
        <Reveal className="mb-12 text-center">
          <p className="font-mono text-sm text-brand">How it works</p>
          <h2 className="mt-2 text-balance text-4xl font-semibold sm:text-5xl">Three steps, no setup.</h2>
        </Reveal>
        <Stagger className="grid gap-5 md:grid-cols-3" gap={0.12}>
          {steps.map((s, i) => (
            <div key={s.t} className="relative h-full rounded-3xl border border-line bg-card p-7">
              <span className="absolute right-6 top-5 font-display text-6xl font-semibold text-line">{i + 1}</span>
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><s.icon size={22} /></span>
              <h3 className="mt-5 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-muted">{s.d}</p>
            </div>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto max-w-5xl">
        <Reveal className="mb-12 text-center">
          <p className="font-mono text-sm text-brand">Engineering</p>
          <h2 className="mt-2 text-balance text-4xl font-semibold sm:text-5xl">Built to be trusted with your code.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">The part most demos skip: what happens with bad input, slow AI and crashed workers.</p>
        </Reveal>
        <Stagger className="grid gap-5 md:grid-cols-3" gap={0.12}>
          {pillars.map((p) => (
            <div key={p.t} className="h-full rounded-3xl border border-line bg-card p-7 transition-colors hover:border-brand/40">
              <p.icon className="text-good" size={26} />
              <h3 className="mt-4 text-xl font-semibold">{p.t}</h3>
              <p className="mt-2 text-muted">{p.d}</p>
            </div>
          ))}
        </Stagger>
        <Reveal delay={0.2} className="mt-10 text-center">
          <Link href="/how-it-works?view=security" className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-6 py-3 text-sm font-medium transition-colors hover:border-brand hover:text-brand">
            See the security &amp; fault tolerance walkthrough <ArrowRight size={16} />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
