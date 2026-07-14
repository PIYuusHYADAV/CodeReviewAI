# CodeReview AI 🤖

An AI-powered GitHub bot that automatically reviews pull requests using **4 specialized LLM agents running in parallel** — catching security vulnerabilities, performance issues, style problems, and architecture concerns before code gets merged.

Built with Next.js, BullMQ, Redis, Groq, and Gemini 2.5 Flash. Integrates as a **GitHub App** so reviews appear as `aicodereview001[bot]` comments and GitHub Check Runs directly on PRs.

> ### 🔗 [**Install the app → github.com/apps/aicodereview001**](https://github.com/apps/aicodereview001)
>
> Add it to any repo and it starts reviewing new PRs automatically — no setup on your end required.

---

## What You Get on Every PR

**1. Instant placeholder comment** — appears within 2 seconds of opening a PR:

```
🤖 CodeReview AI

⏳ Review in progress...

Running 4 specialized agents in parallel:
- 🔒 Security
- ⚡ Performance
- ✏️ Style
- 🏛️ Architecture

This comment will be updated with findings shortly.
```

**2. GitHub Check Run** — shows on the PR header like CI/CD:

```
⏳ CodeReview AI — Analyzing your PR...        [Details]
✅ CodeReview AI — Score 8.2/10 — 0 critical  [Details]
❌ CodeReview AI — Score 3.1/10 — 1 critical  [Details]
```

**3. Summary comment** — placeholder updates with full review:

```
🤖 CodeReview AI

> The PR introduces solid routing logic but has a critical security
> vulnerability in the authentication handler.

Overall Score: 6.8/10

| Dimension       | Score            |
|-----------------|------------------|
| 🔒 Security     | ██████░░░░  6/10 |
| ⚡ Performance  | ████████░░  8/10 |
| ✏️ Style        | ███████░░░  7/10 |
| 🏛️ Architecture | ██████░░░░  6/10 |

Findings (4 total)

🔴 [CRITICAL] httpServer.java:23 — Hardcoded credentials found
🟡 [WARNING]  httpServer.java:78 — Database query inside loop (N+1)
🔵 [INFO]     httpServer.java:45 — Variable name 'x' is not descriptive
🔵 [INFO]     httpServer.java:91 — Consider extracting this into a service layer
```

**4. Inline comments** — findings anchored to exact lines in the diff (Files Changed tab)

**5. Re-review on demand** — comment `/review` on any PR to trigger a fresh review without pushing new code

---

## Architecture

```
GitHub PR opened / commit pushed / /review comment
          │
          ▼ webhook (HMAC-SHA256 verified)
┌─────────────────────────────────────────────────┐
│            Next.js API Route — Vercel            │
│  • Verify HMAC-SHA256 signature                  │
│  • Skip WIP/draft PRs ([wip], [skip-review])     │
│  • Idempotency check (repo:pr:commitSha)         │
│  • Post placeholder comment instantly            │
│  • Create GitHub Check Run (in_progress)         │
│  • Return 200 in <100ms — non-blocking           │
└──────────────────┬──────────────────────────────┘
                   │ enqueue job
                   ▼
┌─────────────────────────────────────────────────┐
│         Upstash Redis + BullMQ Queue             │
│  jobId = repo:prNumber:commitSha                 │
│  3 retries · exponential backoff                 │
│  Concurrency: 3 parallel jobs                    │
└──────────────────┬──────────────────────────────┘
                   │ worker picks up job
                   ▼
┌─────────────────────────────────────────────────┐
│           Worker Process — Render                │
│  • GitHub App installation token (1hr TTL)       │
│  • Fetch PR diff via Octokit                     │
│  • Fetch full file contents                      │
│  • Warn if files exceed 3000 chars               │
└──────┬──────────┬────────────┬──────────┬───────┘
       │          │            │          │  Promise.all
       ▼          ▼            ▼          ▼
  Security    Performance    Style    Architecture
   Agent        Agent        Agent      Agent
  Groq LLaMA  Groq LLaMA  Groq LLaMA  Groq LLaMA
  diff patch   diff patch  diff patch  full files
       └──────────┴────────────┴──────────┘
                        │ 4x Finding[]
                        ▼
┌─────────────────────────────────────────────────┐
│         Gemini 2.5 Flash — Aggregator            │
│  • Merge findings from all 4 agents              │
│  • Deduplicate overlapping issues                │
│  • Score each dimension (1–10)                   │
│  • Generate human-readable summary               │
└──────────────┬───────────────┬──────────────────┘
               │               │
               ▼               ▼
       Update placeholder   Update Check Run
       comment with review  ✅ success / ❌ failure
               │
               ▼
       Post inline comments
       on exact diff lines
```

---

## Features

| Feature                 | Description                                                                     |
| ----------------------- | ------------------------------------------------------------------------------- |
| **4 parallel agents**   | Security, Performance, Style, Architecture run simultaneously via `Promise.all` |
| **GitHub Check Run**    | ✅/❌ status on PR header — same as CodeRabbit, CodeClimate                     |
| **Instant placeholder** | Bot appears within 2 seconds, updates when review completes                     |
| **Inline comments**     | Findings anchored to exact lines in the diff                                    |
| **`/review` trigger**   | Comment `/review` to re-run review without pushing new code                     |
| **WIP skip**            | PRs with `[wip]`, `[skip-review]`, or `wip:` prefix are ignored                 |
| **Large file warning**  | Files over 3000 chars trigger a modularization warning                          |
| **Idempotency**         | Same commit never reviewed twice — handles GitHub webhook retries               |
| **Per-repo tokens**     | GitHub App installation tokens scoped to each repo — expires in 1hr             |
| **Auto retry**          | Failed jobs retry 3 times with exponential backoff                              |

---

## Deployment Architecture

The app runs as **three independently deployed services** — not a single monolith:

| Service               | Platform          | Role                                                  |
| --------------------- | ----------------- | ----------------------------------------------------- |
| Web service (Next.js) | **Vercel**        | Receives webhooks, verifies signatures, enqueues jobs |
| Queue / shared state  | **Upstash Redis** | Serverless Redis backing BullMQ + idempotency store   |
| Worker process        | **Render**        | Long-running process — runs agents, posts results     |

**Why split across three platforms?**

- **Vercel** handles bursty stateless request traffic — perfect for a webhook that must respond in under 10 seconds and scale to zero when idle.
- **Upstash Redis** is HTTP-based serverless Redis — no persistent connection management from serverless functions, shared between Vercel and Render.
- **Render** hosts the worker as a genuine long-running process — LLM calls to 4 agents plus an aggregator take 15-30 seconds, well past typical serverless limits.

Each tier scales, deploys, and fails independently. A spike in PRs never touches worker capacity — jobs queue in Upstash and the Render worker drains them at its own pace.

---

## Tech Stack

| Layer                  | Technology                                         |
| ---------------------- | -------------------------------------------------- |
| **Framework**          | Next.js 14 (App Router)                            |
| **Language**           | TypeScript                                         |
| **Job Queue**          | BullMQ                                             |
| **Queue Store**        | Upstash Redis (managed, serverless)                |
| **GitHub Integration** | GitHub App + `@octokit/rest` + `@octokit/auth-app` |
| **LLM — Agents**       | Groq `llama-3.3-70b-versatile`                     |
| **LLM — Aggregator**   | Google Gemini 2.5 Flash                            |
| **Hosting — Web**      | Vercel                                             |
| **Hosting — Worker**   | Render                                             |
| **Worker Runtime**     | `tsx`                                              |

---

## How It Works

### 1. GitHub App Webhook

Every PR event fires a webhook to `/api/webhook/github`. The route verifies the HMAC-SHA256 signature, skips WIP PRs, checks Redis for idempotency, posts a placeholder comment, creates a GitHub Check Run, and pushes a job to BullMQ. Returns `200` immediately — all processing is async.

### 2. Job Queue

BullMQ with Upstash Redis handles async processing with automatic retries (3 attempts, exponential backoff) and concurrency control (3 parallel jobs). Idempotency key `repo:prNumber:commitSha` prevents double-reviews on GitHub webhook retries.

### 3. GitHub App Authentication

Instead of a personal access token, the app uses **GitHub App installation tokens** — short-lived tokens (1 hour) scoped to the specific repo. Generated fresh per job via `@octokit/auth-app`. Works for any repo where the app is installed.

### 4. Parallel Agent Fanout

4 agents review the PR simultaneously via `Promise.all`:

- **Security** — hardcoded secrets, injection vulnerabilities, auth bypass, exposed sensitive data
- **Performance** — N+1 queries, memory leaks, blocking I/O, inefficient algorithms
- **Style** — naming conventions, dead code, missing error handling, overly complex functions
- **Architecture** — SOLID violations, tight coupling, separation of concerns, scalability issues

Security, Performance, and Style agents receive the **diff patch**. Architecture agent receives **full file content** (capped at 3000 chars per file). Files exceeding this limit trigger a modularization warning in the placeholder comment.

### 5. Gemini Aggregator

All 4 agent results passed to Gemini 2.5 Flash — merges findings, removes duplicates flagged by multiple agents, scores each dimension 1–10, writes a human-readable summary.

### 6. Results Posted to PR

- **Placeholder comment** updated with full review (scores + all findings)
- **GitHub Check Run** updated to ✅ success or ❌ failure based on score and critical count
- **Inline review comments** posted on exact diff lines (`Promise.allSettled` — failed lines skipped silently)

### 7. Re-review on Demand

Comment `/review` on any PR → `issue_comment` webhook fires → bot fetches latest commit → re-runs full pipeline → posts fresh review.

---

## Key Design Decisions

**Why GitHub App over OAuth/personal token?**
GitHub Apps have their own bot identity (`aicodereview001[bot]`), 3x higher rate limits (15,000 req/hour), short-lived per-repo installation tokens, and work across any repo where the app is installed — not just yours.

**Why GitHub Check Runs?**
Check Runs appear on the PR header like CI/CD — same as CodeRabbit, CodeClimate, SonarQube. More visible than a comment, can signal pass/fail, and clicking Details shows the full breakdown. This is what separates a "bot that posts comments" from a "production code review tool."

**Why BullMQ over direct processing?**
GitHub requires a `200` response within 10 seconds or it retries. LLM calls take 10–30 seconds. BullMQ decouples receiving the webhook from processing it — webhook returns instantly, worker processes in background with automatic retry on failure.

**Why parallel agents instead of one big prompt?**
One "review everything" prompt produces mediocre, unfocused results. Four specialized agents with tight system prompts catch significantly more in their domains. Running in parallel means total time = slowest agent, not the sum of all four.

**Why Gemini for aggregation?**
Multiple agents often flag the same issue from different angles. Gemini's stronger reasoning handles semantic deduplication and coherent synthesis better than programmatic merging or a smaller model.

**Why Vercel + Upstash + Render instead of one host?**
Each service has a fundamentally different runtime profile: bursty stateless traffic (Vercel), persistent shared state without connection-pool headaches (Upstash), and continuous long-running processes (Render). Matching each service to the platform built for its workload beats forcing everything onto one server.

**Idempotency via `jobId = repo:prNumber:commitSha`**
BullMQ skips job creation if the same ID already exists. The same commit is never reviewed twice — even under GitHub webhook retries.

---

## Setup

### Prerequisites

- Node.js 18+
- Redis (`docker run -d -p 6379:6379 redis`) or [Upstash](https://upstash.com) for production
- [Groq API key](https://console.groq.com/keys) — free
- [Gemini API key](https://aistudio.google.com/apikey) — free

### 1. Clone and install

```bash
git clone https://github.com/PIYuusHYADAV/CodeReviewAI
cd CodeReviewAI
npm install
```

### 2. Create a GitHub App

1. Go to [github.com/settings/apps/new](https://github.com/settings/apps/new)
2. Set **Webhook URL** → your URL + `/api/webhook/github`
3. Set **Repository permissions**:
   - Contents → Read-only
   - Pull requests → Read & Write
   - Issues → Read & Write
   - Checks → Read & Write
   - Metadata → Read-only
4. Subscribe to events: **Pull request**, **Issue comment**
5. Generate a private key → copy `.pem` to project root

### 3. Environment variables

```bash
# .env.local
GITHUB_APP_ID=your_app_id
WEBHOOK_SECRET=your_webhook_secret
GROQ_API_KEY=gsk_xxxx
GEMINI_API_KEY=AIzaxxxx
REDIS_URL=redis://localhost:6379
```

### 4. Run locally

```bash
npm run dev              # Terminal 1 — Next.js
npx tsx Worker/index.ts  # Terminal 2 — Worker
npx localtunnel --port 3000  # Terminal 3 — Tunnel
```

### 5. Install the app on a repo

GitHub App → **Install App** → select repo → **Install**. Open a PR — bot reviews it automatically.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   └── webhook/github/
│   │       └── route.ts       # Webhook receiver, signature verification, job enqueue
│   └── page.tsx               # Landing page
├── lib/
│   ├── agents.ts              # Security, Performance, Style, Architecture agents
│   ├── aggregator.ts          # Gemini aggregator — merge, dedupe, score
│   ├── formatter.ts           # Markdown comment formatter
│   ├── github.ts              # Octokit + GitHub App auth + Check Runs
│   ├── queue.ts               # BullMQ queue definition
│   ├── redis.ts               # Redis connection + BullMQ config
│   └── types.ts               # Finding, AgentResult, AggregatedReview types
├── Worker/
│   ├── index.ts               # Worker entry point
│   └── worker.ts              # Full review pipeline
├── private-key.pem            # GitHub App private key (gitignored)
└── .env.local                 # Environment variables (gitignored)
```

---

## Author

**Piyush Yadav** — [linkedin.com/in/piyush-yadav](https://www.linkedin.com/in/piyush-yadav-9611832b4/) · [github.com/PIYuusHYADAV](https://github.com/PIYuusHYADAV)
