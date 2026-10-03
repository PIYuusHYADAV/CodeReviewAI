"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { BuiltExperience } from "./built-sim";
import { Reveal } from "../reveal";
import { Counter } from "../counter";
import { DefenseIntro, DefenseLayers } from "../security/defense-layers";
import { Resilience } from "../security/resilience";

const stats = [
  { to: 4, label: "protection layers before any AI runs" },
  { to: 5, label: "automatic retries with backoff" },
  { to: 24, suffix: "h", label: "result cache, same code never re-reviewed" },
  { to: 15, suffix: " min", label: "until a stuck job is recovered" },
];

export function SecurityView({ seed }: { seed?: string }) {
  const [open, setOpen] = useState(!!seed);
  return (
    <div className="space-y-32">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-balance text-xl leading-relaxed text-muted">
          Untrusted input comes in, slow AI work goes out. Here is how the app stays safe, and keeps working, when something goes wrong.
        </p>
      </Reveal>

      <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4" aria-label="At a glance">
        {stats.map((s, i) => (
          <li key={s.label}>
            <Reveal delay={i * 0.08} className="h-full">
              <div className="h-full rounded-2xl border border-line bg-card p-5 text-center">
                <p className="font-display text-5xl font-semibold text-brand"><Counter to={s.to} suffix={s.suffix} /></p>
                <p className="mt-2 text-sm text-muted">{s.label}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>

      <div>
        <DefenseIntro />
        <DefenseLayers />
      </div>

      <Resilience />

      <section>
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-sm text-brand">For the curious</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold sm:text-4xl">Want to poke at it yourself?</h2>
          <p className="mt-3 text-muted">An interactive simulator: pick a scenario, change the inputs, and step through the state of the queue, cache and database. Every step links to the code.</p>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full border border-line bg-card px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
          >
            <SlidersHorizontal size={16} /> {open ? "Hide the simulator" : "Open the simulator"}
            <ChevronDown size={16} className={`transition-transform duration-500 ${open ? "rotate-180" : ""}`} />
          </button>
        </Reveal>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-12"><BuiltExperience initialSearch={seed} /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
