# CodeReview AI 🤖

An AI-powered GitHub bot that automatically reviews pull requests using **4 specialized LLM agents running in parallel** — catching security vulnerabilities, performance issues, style problems, and architecture concerns before code gets merged.

Built with Next.js, BullMQ, Redis, Groq, and Gemini 2.5 Flash. Integrates as a **GitHub App** so reviews appear as `codereview-ai[bot]` comments directly on PRs.

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

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Job Queue | BullMQ |
| Cache / Queue Store | Redis |
| GitHub Integration | GitHub App + Octokit |
| LLM (Agents) | Groq — LLaMA 3.3-70b |
| LLM (Aggregator) | Google Gemini 2.5 Flash |
| Auth | GitHub App (installation tokens) |
| Worker Runtime | tsx |

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

## Setup

### Prerequisites
- Node.js 18+
- Redis (Docker: `docker run -d -p 6379:6379 redis`)
- Groq API key — [console.groq.com](https://console.groq.com)
- Gemini API key — [aistudio.google.com](https://aistudio.google.com)
- GitHub App (see below)

### 1. Clone and install

```bash
git clone https://github.com/PIYuusHYADAV/pr-review-bot
cd pr-review-bot
npm install
```

### 2. Create a GitHub App

- Go to [github.com/settings/apps/new](https://github.com/settings/apps/new)
- Set webhook URL to your deployment URL + `/api/webhook/github`
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

### 4. Run

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

**Idempotency via jobId**
`jobId = repo:prNumber:commitSha` — BullMQ skips a job if the same ID already exists. Prevents double-reviews when GitHub retries webhooks.

---

## Author

**Piyush Yadav** — [linkedin.com/in/piyush-yadav](https://linkedin.com/in/piyush-yadav) · [github.com/PIYuusHYADAV](https://github.com/PIYuusHYADAV)