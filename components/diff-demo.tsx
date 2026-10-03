"use client";
import { motion, useReducedMotion } from "motion/react";
import { ShieldAlert } from "lucide-react";

const lines = [
  "export default function Page() {",
  "  const items = useItems();",
  "  return (",
  "    <main>",
  "      <List items={items} />",
  "oasdpoaskdpasksdpo",
  "    </main>",
  "  );",
];
const BAD = 5;

/* The one orchestrated moment: lines write in, line 6 gets flagged, the review lands on it. */
export function DiffDemo() {
  const reduce = useReducedMotion();
  const t = (i: number) => (reduce ? 0 : 0.5 + i * 0.12);
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-2xl shadow-brand/10">
        <div className="border-b border-line bg-paper px-4 py-2 font-mono text-xs text-muted">src/app/page.tsx</div>
        <div className="py-2 font-mono text-[13px] leading-7">
          {lines.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: t(i), duration: 0.3 }}
              className="relative flex px-4"
            >
              <span className="w-8 select-none text-muted/60">{i + 1}</span>
              <span className="whitespace-pre">{l}</span>
              {i === BAD && (
                <motion.span
                  aria-hidden
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: reduce ? 0 : 2, duration: 0.5 }}
                  className="absolute inset-0 origin-left border-l-2 border-bad bg-bad/10"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: reduce ? 0 : 2.6, type: "spring", bounce: 0.3 }}
        className="relative -mt-8 ml-6 rounded-2xl border border-bad/30 bg-card p-4 shadow-xl sm:ml-16"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldAlert size={16} className="text-bad" /> CodeReview AI
          <span className="rounded-full bg-bad/10 px-2 py-0.5 text-xs text-bad">Critical</span>
        </div>
        <p className="mt-2 text-sm text-muted">Line 6 is not valid code and will stop this file from compiling.</p>
      </motion.div>
    </div>
  );
}
