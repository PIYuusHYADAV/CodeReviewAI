# CodeReview AI 🤖

An AI-powered GitHub bot that automatically reviews pull requests using **4 specialized LLM agents running in parallel** — catching security vulnerabilities, performance issues, style problems, and architecture concerns before code gets merged.

Built with Next.js, BullMQ, Redis, Groq, and Gemini 2.5 Flash. Integrates as a **GitHub App** so reviews appear as `codereview-ai[bot]` comments directly on PRs.

> ### 🔗 [**Install the app → github.com/apps/aicodereview001**](https://github.com/apps/aicodereview001)
>
> Add it to any repo and it starts reviewing new PRs automatically — no setup on your end required.

---

## Demo

Open a PR → bot automatically reviews it and posts findings:

**Summary comment (PR Conversation tab)**

```
## 🤖 CodeReview AI

> The PR introduces a multithreaded HTTP server with solid routing logic,
> but has critical security concerns around input validation.

### Overall Score: 6.8/10

| Dimension    | Score              |
|--------------|--------------------|
| 🔒 Security  | ██████░░░░  6/10   |
| ⚡ Performance | ████████░░  8/10  |
| ✏️ Style     | ███████░░░  7/10   |
| 🏛️ Architecture | ██████░░░░ 6/10  |

### Findings (4 total)

🔴 [CRITICAL] `httpServer.java:23` — Hardcoded credentials found
🟡 [WARNING]  `httpServer.java:78` — Database query inside loop (N+1)
🔵 [INFO]     `httpServer.java:45` — Variable name 'x' is not descriptive
🔵 [INFO]     `httpServer.java:91` — Consider extracting this into a service layer
```

**Inline comments (Files changed tab)** — findings anchored to specific lines in the diff.

---

## Architecture

```
GitHub PR opened/updated
        ↓
Webhook → Next.js API Route
  • Verify HMAC-SHA256 signature
  • Idempotency check (repo:pr:commitSha)
  • Push job to BullMQ
        ↓
Redis BullMQ Queue (async)
        ↓
Worker Process
  • Generate GitHub App installation token
  • Fetch PR diff via Octokit
  • Fetch full file contents
        ↓
4 Agents run in parallel (Promise.all)
  ┌─────────────────────────────────────┐
  │ Security      │ Groq LLaMA 3.3-70b  │
  │ Performance   │ Groq LLaMA 3.3-70b  │
  │ Style         │ Groq LLaMA 3.3-70b  │
  │ Architecture  │ Groq LLaMA 3.3-70b  │
  └─────────────────────────────────────┘
        ↓
Gemini 2.5 Flash Aggregator
  • Merge findings
  • Deduplicate overlapping issues
  • Score each dimension (1-10)
  • Generate summary
        ↓
Post to GitHub PR
  • Summary comment (PR Conversation tab)
  • Inline comments (Files changed tab)
```

---

## Deployment Architecture

The app runs as **three independently deployed services** across three platforms — not a single monolith, and not colocated on one host:

| Service               | Platform          | Role                                                                     |
| --------------------- | ----------------- | ------------------------------------------------------------------------ |
| Web service (Next.js) | **Vercel**        | Receives GitHub webhooks, verifies signatures, enqueues jobs             |
| Queue / shared state  | **Upstash Redis** | Serverless-friendly managed Redis backing BullMQ + idempotency           |
| Worker process        | **Render**        | Long-running process that pulls jobs, runs the LLM agents, posts results |

**Why split across three platforms?**

- **Vercel** is built for stateless, bursty request traffic — perfect for a webhook receiver that needs to respond in under 10 seconds and scale to zero when idle.
- **Upstash Redis** is a serverless Redis built for exactly this pattern — HTTP/edge-friendly, no persistent connection management needed from a serverless function, and it's the one piece of shared state both the web service and the worker read/write against.
- **Render** hosts the worker as a genuine long-running process — something Vercel's serverless functions aren't designed for, since LLM calls to 4 agents plus an aggregator can take well past a typical serverless execution limit.

**The result:** each tier scales, deploys, and fails independently. A traffic spike on the webhook (many PRs opened at once) never touches worker capacity — jobs just queue up in Upstash and the Render worker drains them at its own pace. Redeploying the worker to ship a prompt tweak doesn't require redeploying the web service, and vice versa.

---

## Tech Stack

| Layer               | Technology                       |
| ------------------- | -------------------------------- |
| Framework           | Next.js 14 (App Router)          |
| Language            | TypeScript                       |
| Job Queue           | BullMQ                           |
| Cache / Queue Store | Redis (Upstash, managed)         |
| GitHub Integration  | GitHub App + Octokit             |
| LLM (Agents)        | Groq — LLaMA 3.3-70b             |
| LLM (Aggregator)    | Google Gemini 2.5 Flash          |
| Auth                | GitHub App (installation tokens) |
| Worker Runtime      | tsx                              |
| Hosting — Web       | Vercel                           |
| Hosting — Worker    | Render                           |

---

## How It Works

### 1. GitHub App Webhook

Every PR event fires a webhook to `/api/webhook/github`. The route verifies the HMAC-SHA256 signature, checks Redis for idempotency (same commit never reviewed twice), and pushes a job to BullMQ. Returns `200` immediately — all processing is async.

### 2. Job Queue

BullMQ with Redis handles async processing with automatic retries (3 attempts, exponential backoff) and concurrency control (3 parallel jobs).

### 3. GitHub App Authentication

Instead of a personal access token, the app uses **GitHub App installation tokens** — short-lived tokens (1 hour) scoped to the specific repo that triggered the review. This means the bot can review PRs on any repo where the app is installed, not just yours.

### 4. Parallel Agent Fanout

4 agents review the PR simultaneously:

- **Security** — hardcoded secrets, injection vulnerabilities, auth bypass, exposed sensitive data
- **Performance** — N+1 queries, memory leaks, blocking I/O, inefficient algorithms
- **Style** — naming conventions, dead code, missing error handling, overly complex functions
- **Architecture** — SOLID violations, tight coupling, separation of concerns, scalability issues

Security, Performance, and Style agents receive the **diff patch** — enough context for line-level issues. The Architecture agent receives **full file content** — needed for broader design analysis.

### 5. Gemini Aggregator

All 4 agent results are passed to Gemini 2.5 Flash which merges findings, removes duplicates flagged by multiple agents, scores each dimension from 1-10, and writes a human-readable summary.

### 6. GitHub Comments

Results are posted back to the PR as:

- A **summary comment** on the Conversation tab with scores and all findings
- **Inline review comments** anchored to specific lines in the diff (for findings with line numbers)

---

## Highlights

- **Real GitHub App, not a token hack** — own bot identity (`codereview-ai[bot]`), short-lived per-repo installation tokens, and 3x the rate limit of a personal access token.
- **Genuinely distributed deployment** — web service (Vercel), queue (Upstash Redis), and worker (Render) run as three separately deployed, separately scaling services, not one process wearing three hats.
- **Async job processing done right** — webhook responds in under 10 seconds (as GitHub requires) while the actual 10-30s LLM calls run in the background on a completely separate worker.
- **Multi-agent LLM fanout** — 4 specialized agents (Security, Performance, Style, Architecture) run concurrently via `Promise.all`, each with a narrow, focused prompt rather than one generic "review everything" call — turning total review time into the slowest single agent instead of the sum of all four.
- **LLM-based aggregation, not string matching** — a Gemini 2.5 Flash pass merges and deduplicates overlapping findings across agents, scores each dimension, and writes a coherent summary.
- **Security-conscious webhook design** — HMAC-SHA256 signature verification and idempotency keyed on `repo:prNumber:commitSha` to safely handle GitHub's webhook retries.
- **Line-anchored inline review comments** — findings map back to exact diff lines, not just a wall of text in a summary comment.

---

## Setup

### Prerequisites

- Node.js 18+
- Redis (Docker: `docker run -d -p 6379:6379 redis`, or an Upstash Redis instance for production)
- Groq API key — [console.groq.com](https://console.groq.com)
- Gemini API key — [aistudio.google.com](https://aistudio.google.com)
- GitHub App (see below)

### 1. Clone and install

```bash
git clone https://github.com/PIYuusHYADAV/CodeReviewAI
cd CodeReviewAI
npm install
```

### 2. Create a GitHub App

- Go to [github.com/settings/apps/new](https://github.com/settings/apps/new)
- Set the webhook URL to your web service's URL + `/api/webhook/github`
- Set permissions: **Pull requests** (Read & Write), **Contents** (Read), **Issues** (Read & Write), **Metadata** (Read)
- Subscribe to **Pull request** events
- Generate a private key → download the `.pem` file
- Copy the `.pem` file to your project root as `private-key.pem`

### 3. Environment variables

Create `.env.local`:

```bash
# GitHub App
GITHUB_APP_ID=your_app_id
WEBHOOK_SECRET=your_webhook_secret

# LLMs
GROQ_API_KEY=gsk_xxxx
GEMINI_API_KEY=AIzaxxxx

# Redis
REDIS_URL=redis://localhost:6379
```

### 4. Run locally

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Worker
npx tsx Worker/index.ts

# Terminal 3 — Tunnel (for local testing)
npx localtunnel --port 3000
```

### 5. Install the GitHub App on a repo

Go to your GitHub App → **Install App** → select a repo → **Install**.

Now open a PR on that repo and the bot will automatically review it.

---

## Project Structure

```
├── app/
│   └── api/
│       └── webhook/
│           └── github/
│               └── route.ts      # Webhook receiver
├── lib/
│   ├── agents.ts                 # 4 LLM agents (Security, Performance, Style, Architecture)
│   ├── aggregator.ts             # Gemini aggregator
│   ├── formatter.ts              # Markdown comment formatter
│   ├── github.ts                 # Octokit helpers + GitHub App auth
│   ├── queue.ts                  # BullMQ queue definition
│   ├── redis.ts                  # Redis connection
│   └── types.ts                  # Shared types (Finding, AgentResult)
├── Worker/
│   ├── index.ts                  # Worker entry point
│   └── worker.ts                 # Job processor
├── private-key.pem               # GitHub App private key (gitignored)
└── .env.local                    # Environment variables (gitignored)
```

---

## Key Design Decisions

**Why GitHub App over OAuth?**
GitHub Apps have their own bot identity (`codereview-ai[bot]`), higher rate limits (15,000 req/hour vs 5,000), and use short-lived installation tokens scoped per repo — more secure and production-grade than personal access tokens.

**Why BullMQ over direct processing?**
The webhook must return `200` within 10 seconds or GitHub retries. LLM calls take 10-30 seconds. BullMQ decouples receiving the webhook from processing it — webhook returns immediately, worker processes in background.

**Why parallel agents?**
Total review time = slowest single agent (~5-8s) instead of sum of all agents (~20-30s). Each agent also specializes in one dimension — focused prompts produce better findings than one general "review everything" prompt.

**Why Gemini for aggregation?**
Multiple agents often flag the same issue from different angles. Gemini's stronger reasoning capability handles deduplication and synthesis better than a programmatic merge, and produces more coherent summaries.

**Why Vercel + Upstash + Render instead of one host?**
Each service has a fundamentally different runtime profile: the web service is bursty request/response traffic (Vercel's specialty), Redis needs to be reachable from a serverless function without connection-pool headaches (Upstash's HTTP-based Redis solves this), and the worker needs to run continuously for 10-30s LLM calls (which serverless functions aren't built for, but Render is). Matching each service to the platform built for its workload beats forcing everything onto one server.

**Idempotency via jobId**
`jobId = repo:prNumber:commitSha` — BullMQ skips a job if the same ID already exists. Prevents double-reviews when GitHub retries webhooks.

---

## Author

**Piyush Yadav** — [linkedin.com/in/piyush-yadav](https://www.linkedin.com/in/piyush-yadav-9611832b4/) · [github.com/PIYuusHYADAV](https://github.com/PIYuusHYADAV)
