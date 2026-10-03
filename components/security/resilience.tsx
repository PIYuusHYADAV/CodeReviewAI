"use client";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";

import { Reveal } from "../reveal";

const ease = [0.22, 1, 0.36, 1] as const;

/* Each card plays its own tiny simulation the first time it scrolls into view. */
function useOnce() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, margin: "-120px" });
  const reduce = useReducedMotion();
  return { ref, on: on || !!reduce, reduce: !!reduce };
}

function Retries() {
  const { ref, on } = useOnce();
  const tone = ["bad", "bad", "good"] as const;
  return (
    <div ref={ref} className="flex items-center gap-2">
      {[0, 1, 2, 3, 4].map((i) => {
        const t = tone[i];
        return (
          <motion.div key={i} initial={{ opacity: 0.25, scale: 0.8 }} animate={on ? { opacity: i > 2 ? 0.25 : 1, scale: 1 } : {}} transition={{ delay: 0.3 + i * 0.75, duration: 0.4, ease }} className="flex flex-col items-center gap-1">
            <span className={`grid size-9 place-items-center rounded-full border text-xs ${t === "bad" ? "border-bad/40 bg-bad/10 text-bad" : t === "good" ? "border-good/40 bg-good/10 text-good" : "border-line text-muted"}`}>
              {t === "bad" ? <X size={14} /> : t === "good" ? <Check size={14} /> : i + 1}
            </span>
            <span className="font-mono text-[10px] text-muted">{i === 0 ? "now" : `+${5 * 2 ** (i - 1)}s`}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function Dedup() {
  const { ref, on } = useOnce();
  return (
    <div ref={ref} className="relative flex h-14 items-center justify-center gap-3 font-mono text-xs">
      <motion.span initial={{ x: -50, opacity: 0 }} animate={on ? { x: 0, opacity: 1 } : {}} transition={{ duration: 0.6, ease }} className="rounded-lg border border-line bg-paper px-3 py-1.5">push #1 · a91f</motion.span>
      <motion.span initial={{ x: 50, opacity: 0 }} animate={on ? { x: 0, opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.3, ease }} className="rounded-lg border border-line bg-paper px-3 py-1.5">push #2 · a91f</motion.span>
      <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={on ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 1.2, type: "spring", bounce: 0.4 }} className="absolute -bottom-3 rounded-full border border-good/40 bg-good/10 px-3 py-0.5 text-good">1 review · 0 extra AI calls</motion.span>
    </div>
  );
}

function Stuck() {
  const { ref, on } = useOnce();
  return (
    <div ref={ref}>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-line">
        <motion.div initial={{ width: 0 }} animate={on ? { width: "100%" } : {}} transition={{ duration: 2.4, ease: "linear" }} className="h-full rounded-full bg-gradient-to-r from-brand to-bad" />
        <span className="absolute inset-y-0 left-[60%] w-px bg-white/70" />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted"><span>0 min</span><span>15 min · stale</span><span>20</span></div>
      <motion.p initial={{ opacity: 0, y: 6 }} animate={on ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.7 }} className="mt-2 text-center font-mono text-xs text-good">abandoned → queued again</motion.p>
    </div>
  );
}

function Isolated() {
  const { ref, on } = useOnce();
  const rows = [true, true, false, true];
  return (
    <div ref={ref} className="space-y-1.5">
      {rows.map((ok, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.15 + i * 0.35, duration: 0.5, ease }} className={`flex items-center justify-between rounded-lg border px-3 py-1.5 font-mono text-xs ${ok ? "border-good/30 bg-good/10 text-good" : "border-bad/30 bg-bad/10 text-bad"}`}>
          <span>inline comment {i + 1}</span>
          <span>{ok ? "posted" : "failed · others unaffected"}</span>
        </motion.div>
      ))}
    </div>
  );
}

function Decoupled() {
  const { ref, on } = useOnce();
  return (
    <div ref={ref} className="space-y-2 font-mono text-xs">
      <div className="flex items-center gap-2">
        <span className="w-14 text-muted">Web</span>
        <motion.div initial={{ width: 0 }} animate={on ? { width: "18%" } : {}} transition={{ duration: 0.5, ease }} className="h-2.5 rounded-full bg-good" />
        <motion.span initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={{ delay: 0.6 }} className="text-good">replied</motion.span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-14 text-muted">Worker</span>
        <motion.div initial={{ width: 0 }} animate={on ? { width: "78%" } : {}} transition={{ duration: 2.2, delay: 0.6, ease: "linear" }} className="h-2.5 rounded-full bg-brand" />
      </div>
    </div>
  );
}

function FailOpen() {
  const { ref, on } = useOnce();
  return (
    <div ref={ref} className="flex items-center justify-center gap-3 font-mono text-xs">
      <motion.span initial={{ opacity: 0.4 }} animate={on ? { opacity: 1, borderColor: "var(--color-bad)" } : {}} transition={{ delay: 0.4, duration: 0.5 }} className="rounded-lg border border-line bg-paper px-3 py-2">Redis hiccup</motion.span>
      <motion.span initial={{ scaleX: 0 }} animate={on ? { scaleX: 1 } : {}} transition={{ delay: 1, duration: 0.5 }} className="h-px w-8 origin-left bg-good" />
      <motion.span initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={{ delay: 1.4 }} className="rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-good">review still runs</motion.span>
    </div>
  );
}

const CARDS = [
  { title: "Retries with backoff", problem: "The AI provider times out.", fix: "Up to 5 attempts, waiting 5s, 10s, 20s… between each. Permanent failures are recorded in the database, not lost.", Viz: Retries },
  { title: "Never review twice", problem: "Two pushes land with identical code.", fix: "Reviews are keyed to the tree SHA, so the saved result is reused: no second job, no second AI bill.", Viz: Dedup },
  { title: "Self-healing stuck jobs", problem: "A worker dies mid-review.", fix: "A record stuck over 15 minutes counts as abandoned and is queued again. A nightly sweep requeues anything still stale.", Viz: Stuck },
  { title: "Failures stay contained", problem: "One inline comment can't be posted.", fix: "Comments are posted independently. One failure never takes down the rest of the review.", Viz: Isolated },
  { title: "Fast replies, slow work apart", problem: "A review takes a minute; GitHub waits seconds.", fix: "The web service answers immediately and queues the job. A separate worker (3 at a time) does the slow AI work.", Viz: Decoupled },
  { title: "Fails open, not shut", problem: "The rate limiter's Redis call errors.", fix: "The limiter lets the event through rather than blocking developers. Availability beats strictness here.", Viz: FailOpen },
] as const;

export function Resilience() {
  return (
    <section>
      <Reveal className="mx-auto mb-12 max-w-3xl text-center">
        <p className="font-mono text-sm text-brand">Fault tolerance</p>
        <h2 className="mt-2 text-balance text-4xl font-semibold sm:text-5xl">Built assuming things will break.</h2>
        <p className="mt-4 text-lg text-muted">Six failure modes, and what the system does about each one.</p>
      </Reveal>
      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
        {CARDS.map((c, i) => (
          <Reveal key={c.title} delay={(i % 2) * 0.1} className="h-full">
            <article className="group flex h-full flex-col rounded-3xl border border-line bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/10">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-bad/30 bg-bad/10 px-3 py-1 text-xs text-bad">If: {c.problem}</p>
              <h3 className="mt-4 text-2xl font-semibold">{c.title}</h3>
              <p className="mt-2 flex-1 text-muted">{c.fix}</p>
              <div className="mt-6 rounded-2xl border border-line bg-paper/70 p-4 pb-5"><c.Viz /></div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
