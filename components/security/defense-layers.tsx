"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { Copy, Filter, Gauge, KeyRound } from "lucide-react";

import { cn } from "../../lib/utils";
import { Reveal } from "../reveal";

const LAYERS = [
  { icon: KeyRound, name: "Signed webhooks", block: "Forged request → 401", text: "Every request must carry GitHub's HMAC-SHA256 signature, checked with a constant-time compare. A fake request is rejected before any work happens, so it can never spend model credits." },
  { icon: Filter, name: "Event filtering", block: "Wrong event → ignored", text: "POST only. Just opened and updated pull requests count; drafts and [WIP] titles are skipped. Everything else is dropped with no side effects." },
  { icon: Gauge, name: "Rate limiting", block: "Burst → turned away", text: "Redis counts events: 3 per pull request and 20 per repo each minute. A noisy repo can't drown the queue or run up the AI bill." },
  { icon: Copy, name: "Deduplication", block: "Same code → reused", text: "One review per repo and tree SHA, enforced by a unique database record and a deterministic job ID. Identical code is never reviewed twice." },
] as const;

const GX = [170, 320, 470, 620];
const clamp = (v: number) => Math.min(1, Math.max(0, v));

function Attacker({ p, i }: { p: MotionValue<number>; i: number }) {
  const local = (v: number) => clamp(v * 4 - i);
  const y = useTransform(p, (v) => 30 + Math.min(1, local(v) / 0.6) * 112);
  const opacity = useTransform(p, (v) => {
    const l = local(v);
    return l <= 0 || l >= 1 ? 0 : l < 0.6 ? 1 : 1 - (l - 0.6) / 0.4;
  });
  const scale = useTransform(p, (v) => {
    const l = local(v);
    return l < 0.6 ? 1 : 1 + ((l - 0.6) / 0.4) * 2.4;
  });
  return (
    <motion.g style={{ x: GX[i], y, opacity, scale }}>
      <circle r={9} fill="var(--color-bad)" />
      <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#06070c" strokeWidth={2} strokeLinecap="round" />
    </motion.g>
  );
}

function Gate({ p, i }: { p: MotionValue<number>; i: number }) {
  const Icon = LAYERS[i].icon;
  const fill = useTransform(p, (v) => (v * 4 >= i + 0.62 ? 1 : 0));
  const ring = useTransform(p, (v) => (v * 4 >= i && v * 4 < i + 1 ? "var(--color-brand)" : "var(--color-line)"));
  return (
    <g transform={`translate(${GX[i]} 180)`}>
      <motion.rect x={-30} y={-52} width={60} height={104} rx={18} fill="var(--color-card)" strokeWidth={2} style={{ stroke: ring }} />
      <motion.rect x={-30} y={-52} width={60} height={104} rx={18} fill="var(--color-good)" style={{ opacity: useTransform(fill, (f) => f * 0.14) }} />
      <foreignObject x={-14} y={-14} width={28} height={28}>
        <div className="grid size-7 place-items-center text-brand"><Icon size={20} /></div>
      </foreignObject>
    </g>
  );
}

function Stage({ p }: { p: MotionValue<number> }) {
  const px = useTransform(p, [0, 1], [48, 742]);
  return (
    <svg viewBox="0 10 800 250" className="w-full" role="img" aria-label="A legitimate request passes four protective layers while attackers are stopped at each one">
      <line x1={48} y1={180} x2={742} y2={180} stroke="var(--color-line)" strokeWidth={3} strokeDasharray="4 8" />
      <motion.line x1={48} y1={180} x2={742} y2={180} stroke="var(--color-good)" strokeWidth={3} style={{ pathLength: p }} />
      <text x={48} y={236} textAnchor="middle" className="fill-muted text-[13px]">GitHub</text>
      <text x={742} y={236} textAnchor="middle" className="fill-muted text-[13px]">Queue</text>
      {LAYERS.map((_, i) => <Gate key={i} p={p} i={i} />)}
      {LAYERS.map((_, i) => <Attacker key={i} p={p} i={i} />)}
      <motion.g style={{ x: px, y: 180 }}>
        <circle r={20} fill="var(--color-good)" opacity={0.2} />
        <circle r={10} fill="var(--color-good)" />
      </motion.g>
    </svg>
  );
}

/* Pinned while the visitor scrolls: scroll position drives the packet and which layer is explained. */
export function DefenseLayers() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useTransform(scrollYProgress, [0.04, 0.96], [0, 1]);
  const [idx, setIdx] = useState(0);
  useMotionValueEvent(p, "change", (v) => setIdx(Math.min(3, Math.max(0, Math.floor(v * 4)))));

  if (reduce) {
    return (
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
        {LAYERS.map((l) => (
          <div key={l.name} className="rounded-2xl border border-line bg-card p-6">
            <l.icon className="text-brand" size={22} />
            <h3 className="mt-3 text-xl font-semibold">{l.name}</h3>
            <p className="mt-2 text-muted">{l.text}</p>
          </div>
        ))}
      </div>
    );
  }
  const L = LAYERS[idx];
  return (
    <div ref={ref} className="relative h-[360vh]">
      <div className="sticky top-24 mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-3xl border border-line bg-card/80 p-5 shadow-2xl shadow-brand/10 backdrop-blur sm:p-8">
          <div className="mb-2 flex flex-wrap gap-2" aria-hidden>
            {LAYERS.map((l, i) => (
              <span key={l.name} className={cn("rounded-full border px-3 py-1 text-xs transition-colors duration-500", i === idx ? "border-brand/50 bg-brand-soft text-brand" : i < idx ? "border-good/30 text-good" : "border-line text-muted")}>
                {i + 1}. {l.name}
              </span>
            ))}
          </div>
          <Stage p={p} />
          <div className="relative min-h-[132px] rounded-2xl border border-line bg-paper/70 p-5" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-semibold">{L.name}</h3>
                  <span className="rounded-full border border-bad/30 bg-bad/10 px-2.5 py-0.5 font-mono text-xs text-bad">{L.block}</span>
                </div>
                <p className="mt-2 max-w-3xl text-muted">{L.text}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-muted">Keep scrolling: the green request passes every layer, the red ones don&apos;t.</p>
      </div>
    </div>
  );
}

export function DefenseIntro() {
  return (
    <Reveal className="mx-auto mb-10 max-w-3xl text-center">
      <p className="font-mono text-sm text-brand">Security</p>
      <h2 className="mt-2 text-balance text-4xl font-semibold sm:text-5xl">Four layers stand between the internet and the AI bill.</h2>
      <p className="mt-4 text-lg text-muted">Scroll to send one real request and four bad ones through the gate.</p>
    </Reveal>
  );
}
