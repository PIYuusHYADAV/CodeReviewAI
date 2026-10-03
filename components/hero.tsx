"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ChevronsDown } from "lucide-react";

import { Github } from "./github-icon";
import { Button } from "./ui/button";
import { DiffDemo } from "./diff-demo";
import { ScreenshotFrame } from "./screenshot-frame";
import { Reveal } from "./reveal";
const agents = ["Security", "Performance", "Style", "Architecture"];

export function Hero() {
  return (
    <>
      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        <div className="grid-bg absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-balance bg-gradient-to-b from-white to-white/55 bg-clip-text text-5xl font-semibold leading-[1.02] text-transparent sm:text-7xl"
            >
              Every pull request, reviewed in seconds.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 max-w-prose text-xl leading-relaxed text-muted"
            >
              CodeReview AI reads every pull request the moment it opens. Four
              specialized agents run in parallel and post findings as inline
              comments, before a human has to look.
            </motion.p>
            <div className="mt-5 flex flex-wrap gap-2">
              {agents.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-line bg-card px-3 py-1 text-sm"
                >
                  {a}
                </span>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <a href="#install">
                  <span className="sheen absolute inset-0" />
                  <Github size={18} /> Install on GitHub
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/how-it-works">
                  See how it works <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted">
              Install it on any repo you maintain.
            </p>
          </div>
          <DiffDemo />
        </div>
        <motion.a
          href="#story"
          aria-label="Scroll to see more"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 3 }, y: { repeat: Infinity, duration: 2, delay: 3 } }}
          className="mx-auto mt-14 flex w-fit text-muted"
        >
          <ChevronsDown size={22} />
        </motion.a>
      </section>

      <section id="story" className="px-6 pb-28">
        <Reveal className="mx-auto max-w-4xl" scale={0.94}>
          <ScreenshotFrame
            src="/screenshots/review.png"
            alt="A CodeReview AI comment on a pull request flagging a critical syntax error"
            caption="A real review, posted automatically."
            w={1552}
            h={778}
          />
        </Reveal>
      </section>
    </>
  );
}
