"use client";
import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import {
  GitPullRequest,
  Webhook,
  MessageSquareDashed,
  ListChecks,
  Bot,
  GitMerge,
  CheckCheck,
} from "lucide-react";

import { ScreenshotFrame } from "./screenshot-frame";
const steps = [
  {
    icon: GitPullRequest,
    title: "You open a pull request",
    text: "Opening a PR or pushing to one is all it takes. Drafts and PRs marked WIP are skipped. Comment /review to run it again.",
    tags: ["GitHub"],
  },
  {
    icon: Webhook,
    title: "GitHub notifies the app",
    text: "The webhook arrives and its signature is checked, so only real GitHub events get through. Redis then checks the rate limits: 3 per PR and 20 per repo each minute.",
    tags: ["Vercel", "Redis limits"],
  },
  {
    icon: MessageSquareDashed,
    title: "A placeholder appears right away",
    text: 'The bot posts a "review in progress" comment and starts a check on the PR, so you know it\'s working.',
    tags: ["GitHub API"],
    shot: {
      src: "/screenshots/placeholder.png",
      w: 1680,
      h: 627,
      alt: "Review in progress comment from the bot",
    },
  },
  {
    icon: ListChecks,
    title: "The job goes into a queue",
    text: "The app checks the cache and the database for the same code, saves a pending review record, then queues the job so the webhook can reply without waiting. A failed job retries automatically, up to 5 attempts, and the same code is never reviewed twice.",
    tags: ["Redis queue", "Postgres record", "Upstash", "Supabase"],
  },
  {
    icon: Bot,
    title: "Four agents read the code in parallel",
    text: "A separate worker takes the job, up to 3 at once, fetches the diff from GitHub, and runs Security, Performance, Style and Architecture, each with its own focused instructions.",
    tags: ["Render worker", "Groq"],
    note: "Security and Performance read the diff plus file context, Style reads the diff, and Architecture reads full files.",
  },
  {
    icon: GitMerge,
    title: "One pass merges the findings",
    text: "Results are combined, duplicates removed, and each area gets a score with a short summary.",
    tags: ["Gemini"],
  },
  {
    icon: CheckCheck,
    title: "The review lands on your lines",
    text: "The result is saved in the database and cached in Redis for 24 hours. Comments appear on the exact lines in the diff, a summary comment is posted, and the check turns success, neutral or failure.",
    tags: ["Postgres", "Redis cache", "GitHub"],
    shot: {
      src: "/screenshots/review.png",
      w: 1552,
      h: 778,
      alt: "Review comment with a critical finding",
    },
  },
];

export function Pipeline() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 60%"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <ol
      ref={ref}
      className="relative mx-auto max-w-4xl space-y-16 pl-14 sm:pl-20"
    >
      <span
        aria-hidden
        className="absolute bottom-0 left-[22px] top-0 w-px bg-line sm:left-[30px]"
      />
      <motion.span
        aria-hidden
        style={{ scaleY }}
        className="absolute bottom-0 left-[21px] top-0 w-0.5 origin-top bg-brand sm:left-[29px]"
      />
      {steps.map((s, i) => (
        <motion.li
          key={s.title}
          initial={{ opacity: 0.25 }}
          whileInView={{ opacity: 1 }}
          viewport={{ margin: "-35% 0px -35% 0px" }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <motion.span
            initial={{ scale: 0.8 }}
            whileInView={{ scale: 1 }}
            viewport={{ margin: "-35% 0px -35% 0px" }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="absolute -left-14 top-0 grid size-11 place-items-center rounded-full border border-brand/30 bg-card text-brand shadow-md sm:-left-20 sm:size-[60px]"
          >
            <s.icon size={22} />
          </motion.span>
          <p className="font-mono text-sm text-brand">Step {i + 1}</p>
          <h3 className="mt-1 text-2xl font-semibold sm:text-3xl">{s.title}</h3>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted">
            {s.text}
          </p>
          {s.tags && (
            <div className="mt-4 flex flex-wrap gap-2">
              {s.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line bg-card px-3 py-1 font-mono text-xs text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {s.note && (
            <p className="mt-3 max-w-xl rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">
              {s.note}
            </p>
          )}
          {s.shot && <ScreenshotFrame {...s.shot} className="mt-8" />}
        </motion.li>
      ))}
    </ol>
  );
}
