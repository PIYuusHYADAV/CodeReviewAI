import {
  Globe,
  Cpu,
  Bot,
  FileCode,
  Boxes,
  GitCommitHorizontal,
  ShieldCheck,
  Webhook,
  Rocket,
  Server,
  Container,
  ListOrdered,
} from "lucide-react";
import { Github } from "../github-icon";
import type { ComponentType } from "react";

export type Kind = "icon" | "db" | "queue";
export type Node = {
  id: string;
  label: string;
  sub: string;
  icon: ComponentType<{ size?: number }>;
  kind: Kind;
  x: number;
  y: number;
};
export type Step = {
  title: string;
  text: string;
  active: string[];
  move?: [string, string];
  packet?: string;
};
export type Zone = {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ids: string[];
};
export type Scenario = {
  id: string;
  name: string;
  blurb: string;
  nodes: Node[];
  steps: Step[];
  zones?: Zone[];
  links?: [string, string][];
};

const n = (
  id: string,
  label: string,
  sub: string,
  icon: Node["icon"],
  kind: Kind,
  x: number,
  y: number,
): Node => ({ id, label, sub, icon, kind, x, y });

/* Copy for deploy / docker / cicd is drafted from the page 4 scope. Verify against the repo before launch. */
export const scenarios: Scenario[] = [
  {
    id: "journey",
    name: "A pull request's journey",
    blurb: "Follow one pull request through every part of the app.",
    nodes: [
      n("gh", "GitHub", "your repo", Github, "icon", 90, 260),
      n("web", "Web service", "answers GitHub", Globe, "icon", 270, 130),
      n(
        "queue",
        "Redis",
        "queue, limits, cache",
        ListOrdered,
        "queue",
        450,
        130,
      ),
      n("worker", "Worker", "does the slow work", Cpu, "icon", 630, 260),
      n("ai", "AI models", "four agents + merge", Bot, "icon", 810, 130),
      n("db", "Database", "Postgres", Server, "db", 450, 385),
    ],
    steps: [
      {
        title: "Paused at the start",
        text: "Press Next to follow a pull request from your repo to the review on your lines.",
        active: [],
      },
      {
        title: "You open a pull request",
        text: "Opening a PR or pushing to one is all it takes. Drafts and PRs marked WIP are skipped. Comment /review to run it again.",
        active: ["gh"],
      },
      {
        title: "GitHub notifies the app",
        text: "The webhook arrives and its signature is checked, so only real GitHub events get through.",
        active: ["gh", "web"],
        move: ["gh", "web"],
        packet: "webhook",
      },
      {
        title: "Rate limits are checked",
        text: "Redis counts requests: 3 per PR and 20 per repo each minute. Extra events are turned away.",
        active: ["web", "queue"],
        move: ["web", "queue"],
        packet: "limits",
      },
      {
        title: "A placeholder appears right away",
        text: 'The bot posts a "review in progress" comment and starts a check on the PR, so you know it\'s working.',
        active: ["web", "gh"],
        move: ["web", "gh"],
        packet: "comment",
      },
      {
        title: "The app looks for the same code",
        text: "The cache, then the database, is checked for the same code (its tree SHA). A match reuses the saved result.",
        active: ["web", "db"],
        move: ["web", "db"],
        packet: "tree SHA?",
      },
      {
        title: "A review record is saved",
        text: "A pending record goes into the database, unique per repo and code version.",
        active: ["web", "db"],
        move: ["web", "db"],
        packet: "record",
      },
      {
        title: "The job goes into the queue",
        text: "The review is queued so the webhook can reply without waiting. A failed job retries automatically, up to 5 attempts.",
        active: ["web", "queue"],
        move: ["web", "queue"],
        packet: "job",
      },
      {
        title: "The worker picks it up",
        text: "A separate worker takes jobs from the queue, up to 3 at once.",
        active: ["queue", "worker"],
        move: ["queue", "worker"],
        packet: "job",
      },
      {
        title: "The worker fetches your code",
        text: "The diff, PR details and file contents come from GitHub. Large files are condensed.",
        active: ["gh", "worker"],
        move: ["gh", "worker"],
        packet: "diff",
      },
      {
        title: "Four agents read the code in parallel",
        text: "Security, Performance, Style and Architecture each look at the change with their own focused instructions.",
        active: ["worker", "ai"],
        move: ["worker", "ai"],
        packet: "code",
      },
      {
        title: "One pass merges the findings",
        text: "Results are combined, duplicates removed, and each area gets a score with a short summary.",
        active: ["ai", "worker"],
        move: ["ai", "worker"],
        packet: "findings",
      },
      {
        title: "The result is saved",
        text: "The review is stored in the database and cached in Redis for 24 hours.",
        active: ["worker", "db", "queue"],
        move: ["worker", "db"],
        packet: "result",
      },
      {
        title: "The review lands on your lines",
        text: "Comments appear on the exact lines in the diff, a summary comment is posted, and the check turns success, neutral or failure.",
        active: ["worker", "gh"],
        move: ["worker", "gh"],
        packet: "review",
      },
    ],
  },
  {
    id: "deploy",
    name: "Distributed deployment",
    blurb: "Each piece is hosted on a different platform.",
    nodes: [
      n("gh", "GitHub App", "events in, review out", Github, "icon", 95, 235),
      n("web", "Web service", "Next.js API route", Globe, "icon", 300, 115),
      n("queue", "Redis queue", "BullMQ jobs", ListOrdered, "queue", 500, 115),
      n("worker", "Worker", "long-running process", Cpu, "icon", 500, 355),
      n("db", "Postgres", "review records", Server, "db", 300, 355),
      n("ai", "AI models", "Groq + Gemini", Bot, "icon", 760, 235),
    ],
    zones: [
      {
        id: "z-gh",
        label: "GitHub",
        sub: "where it starts and ends",
        x: 5,
        y: 139,
        w: 180,
        h: 204,
        ids: ["gh"],
      },
      {
        id: "z-web",
        label: "Vercel",
        sub: "serverless web",
        x: 210,
        y: 19,
        w: 180,
        h: 204,
        ids: ["web"],
      },
      {
        id: "z-queue",
        label: "Upstash",
        sub: "hosted Redis",
        x: 410,
        y: 19,
        w: 180,
        h: 204,
        ids: ["queue"],
      },
      {
        id: "z-worker",
        label: "Render",
        sub: "background worker",
        x: 410,
        y: 259,
        w: 180,
        h: 204,
        ids: ["worker"],
      },
      {
        id: "z-db",
        label: "Supabase",
        sub: "hosted Postgres",
        x: 210,
        y: 259,
        w: 180,
        h: 204,
        ids: ["db"],
      },
      {
        id: "z-ai",
        label: "Groq + Google AI",
        sub: "model APIs",
        x: 670,
        y: 139,
        w: 180,
        h: 204,
        ids: ["ai"],
      },
    ],
    links: [
      ["gh", "web"],
      ["web", "queue"],
      ["queue", "worker"],
      ["worker", "db"],
      ["worker", "ai"],
    ],
    steps: [
      {
        title: "Paused at the start",
        text: "Each piece runs on a different platform. Press Next to visit each one.",
        active: [],
      },
      {
        title: "Vercel: the web service",
        text: "The Next.js web service runs on Vercel. It receives GitHub's webhook, checks the signature and answers fast.",
        active: ["web"],
      },
      {
        title: "Upstash: Redis",
        text: "Redis is hosted on Upstash. It holds the BullMQ job queue, the rate-limit counters and the 24-hour result cache.",
        active: ["queue"],
      },
      {
        title: "Render: the worker",
        text: "The worker runs as its own long-running process on Render, built from its own Dockerfile. It takes up to 3 jobs at once, so slow AI calls never block the web service.",
        active: ["worker"],
      },
      {
        title: "Supabase: Postgres",
        text: "Review records live in Postgres on Supabase: one per repo and code version.",
        active: ["db"],
      },
      {
        title: "Groq and Google AI: the models",
        text: "The four agents call Groq and the merge step calls Gemini. Both are hosted APIs, so there is nothing to run yourself.",
        active: ["ai"],
      },
      {
        title: "GitHub: start and finish",
        text: "GitHub sends events in, and the worker posts the review back, as comments and a check on the pull request.",
        active: ["gh"],
      },
      {
        title: "The whole picture",
        text: "Six platforms, each doing one job, talking to each other over the network.",
        active: ["gh", "web", "queue", "worker", "db", "ai"],
      },
    ],
  },
  {
    id: "docker",
    name: "Dockerization",
    blurb: "Two Dockerfiles and one compose stack.",
    nodes: [
      n(
        "f1",
        "Web Dockerfile",
        "builds the web image",
        FileCode,
        "icon",
        110,
        120,
      ),
      n(
        "f2",
        "Worker Dockerfile",
        "builds the worker image",
        FileCode,
        "icon",
        110,
        340,
      ),
      n(
        "compose",
        "Compose stack",
        "describes all services",
        Boxes,
        "icon",
        350,
        230,
      ),
      n("redis", "Redis", "queue", Container, "queue", 590, 110),
      n("pg", "Postgres", "database", Container, "db", 590, 350),
      n("run", "Running stack", "web + worker", Container, "icon", 810, 230),
    ],
    steps: [
      {
        title: "Paused at the start",
        text: "The app is packaged as containers. Press Next to see how the pieces fit.",
        active: [],
      },
      {
        title: "The web image",
        text: "The web Dockerfile builds the web service image, and it joins the compose stack.",
        active: ["f1", "compose"],
        move: ["f1", "compose"],
        packet: "web image",
      },
      {
        title: "The worker image",
        text: "The worker Dockerfile builds the worker image, and it joins the same stack.",
        active: ["f2", "compose"],
        move: ["f2", "compose"],
        packet: "worker image",
      },
      {
        title: "The queue starts",
        text: "Redis comes up as a service in the same stack.",
        active: ["compose", "redis"],
        move: ["compose", "redis"],
        packet: "service",
      },
      {
        title: "The database starts",
        text: "Postgres comes up next to it.",
        active: ["compose", "pg"],
        move: ["compose", "pg"],
        packet: "service",
      },
      {
        title: "Web and worker run",
        text: "The two built images start next to the queue and the database, all from one definition.",
        active: ["compose", "run"],
        move: ["compose", "run"],
        packet: "services",
      },
    ],
  },
  {
    id: "cicd",
    name: "CI/CD pipeline",
    blurb: "Checks, a gate, and a deploy hook.",
    nodes: [
      n(
        "push",
        "Change pushed",
        "to the repo",
        GitCommitHorizontal,
        "icon",
        80,
        150,
      ),
      n("checks", "Checks", "run automatically", ShieldCheck, "icon", 250, 320),
      n("gate", "Gate", "pass to continue", ShieldCheck, "icon", 420, 150),
      n("hook", "Deploy hook", "tells the host", Webhook, "icon", 590, 320),
      n(
        "live",
        "Services update",
        "new version runs",
        Server,
        "icon",
        760,
        150,
      ),
      n("ship", "Shipped", "", Rocket, "icon", 835, 350),
    ],
    steps: [
      {
        title: "Paused at the start",
        text: "A change reaches the repo. Press Next to see what happens before it ships.",
        active: [],
      },
      {
        title: "A change is pushed",
        text: "Pushing code starts the pipeline.",
        active: ["push", "checks"],
        move: ["push", "checks"],
        packet: "commit",
      },
      {
        title: "Checks run",
        text: "Automated checks look at the change.",
        active: ["checks", "gate"],
        move: ["checks", "gate"],
        packet: "results",
      },
      {
        title: "The gate decides",
        text: "Only a change that passes the checks goes on. A failing change stops here.",
        active: ["gate", "hook"],
        move: ["gate", "hook"],
        packet: "pass",
      },
      {
        title: "The deploy hook fires",
        text: "Once the gate passes, the hook tells the host to deploy.",
        active: ["hook", "live"],
        move: ["hook", "live"],
        packet: "deploy",
      },
      {
        title: "The services update",
        text: "The new version replaces the old one.",
        active: ["live", "ship"],
        move: ["live", "ship"],
        packet: "new version",
      },
    ],
  },
];
