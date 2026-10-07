import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Cpu,
  Database,
  GitPullRequest,
  Globe,
  ListOrdered,
  MessageSquareText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { cn } from "../lib/utils";

type Step = {
  n: number;
  icon: LucideIcon;
  title: string;
  host: string;
  text: string;
  place: string;
  arrow?: "right" | "left" | "down";
};

/* The whole request path on one screen, in reading order (1 to 6). On wide screens it snakes: left to right, then back. */
const STEPS: Step[] = [
  { n: 1, icon: GitPullRequest, title: "Pull request opened", host: "GitHub", text: "GitHub sends a signed webhook.", place: "md:col-start-1 md:row-start-1", arrow: "right" },
  { n: 2, icon: Globe, title: "Web service", host: "Vercel", text: "Verifies the signature, filters the event, applies rate limits, replies at once.", place: "md:col-start-2 md:row-start-1", arrow: "right" },
  { n: 3, icon: ListOrdered, title: "Job queue", host: "Upstash Redis · BullMQ", text: "The job waits here. Failures retry up to 5 attempts with backoff.", place: "md:col-start-3 md:row-start-1", arrow: "down" },
  { n: 4, icon: Cpu, title: "Worker + 4 agents", host: "Render · Groq", text: "Claims the review in Postgres, then runs security, performance, style and architecture in parallel.", place: "md:col-start-3 md:row-start-2", arrow: "left" },
  { n: 5, icon: Sparkles, title: "Aggregator", host: "Gemini 2.5 Flash", text: "Merges and de-duplicates the findings into one score and summary.", place: "md:col-start-2 md:row-start-2", arrow: "left" },
  { n: 6, icon: MessageSquareText, title: "Review posted", host: "GitHub", text: "Inline comments and a Check Run, on this PR and on every identical PR that was waiting.", place: "md:col-start-1 md:row-start-2" },
];

const DESKTOP_ARROW = {
  right: { cls: "md:-right-[34px] md:top-1/2 md:-translate-y-1/2", Icon: ArrowRight },
  left: { cls: "md:-left-[34px] md:top-1/2 md:-translate-y-1/2", Icon: ArrowLeft },
  down: { cls: "md:-bottom-[34px] md:left-1/2 md:-translate-x-1/2", Icon: ArrowDown },
} as const;

const arrowBase = "absolute z-10 size-7 place-items-center rounded-full border border-line bg-paper text-brand";

export function Architecture() {
  return (
    <div className="mx-auto max-w-5xl">
      <ol className="grid gap-x-10 gap-y-10 md:grid-cols-3">
        {STEPS.map((s) => {
          const D = s.arrow ? DESKTOP_ARROW[s.arrow] : null;
          return (
            <li key={s.n} className={cn("relative rounded-2xl border border-line bg-card p-5", s.place)}>
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                  <s.icon size={20} aria-hidden />
                </span>
                <span className="font-mono text-xs text-muted">Step {s.n}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="font-mono text-xs text-brand">{s.host}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>

              {s.n < 6 && (
                <span aria-hidden className={cn(arrowBase, "-bottom-[34px] left-1/2 grid -translate-x-1/2 md:hidden")}>
                  <ArrowDown size={14} />
                </span>
              )}
              {D && (
                <span aria-hidden className={cn(arrowBase, "hidden md:grid", D.cls)}>
                  <D.Icon size={14} />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="flex items-center gap-2 font-mono text-xs text-brand"><Database size={14} aria-hidden /> Postgres · Supabase</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Source of truth. One row per repo and tree SHA decides which request owns the review. It also stores waiting requests and the finished result.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="flex items-center gap-2 font-mono text-xs text-brand"><Database size={14} aria-hidden /> Redis · Upstash</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Fast shared state: the job queue, the rate-limit counters, and a 24-hour cache of finished reviews.
          </p>
        </div>
      </div>
    </div>
  );
}
