"use client";
import { motion, useReducedMotion } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

/* Fades, lifts and un-blurs once when it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 28,
  x = 0,
  scale = 1,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  x?: number;
  scale?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y, x, scale: scale === 1 ? 1 : 0.94, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.85, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Wrap a grid: each child Reveals in turn. */
export function Stagger({ children, className, gap = 0.09 }: { children: React.ReactNode[]; className?: string; gap?: number }) {
  return (
    <div className={className}>
      {children.map((c, i) => (
        <Reveal key={i} delay={i * gap} className="h-full">
          {c}
        </Reveal>
      ))}
    </div>
  );
}
