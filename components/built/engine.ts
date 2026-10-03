/*
 * Scenario data for the 'Security & fault tolerance' view on /how-it-works. Every rule below mirrors the code in the repo (file + lines are linked in the UI).
 * The simulation is a model of that logic: it makes no network calls and stores nothing about the visitor.
 * Scenarios marked `locked` stay "coming soon" until the code change they depend on ships (plan: fixes 1, 2, 3, 5).
 */
export type Group = "Normal" | "Protection" | "Failure";
export type Tone = "ok" | "bad" | "warn" | "info";
export type Inspector = { record: string; queue: string; limits: string; cache: string; check: string };
export type Code = { path: string; lines: [number, number] };
export type Gloss = { term: string; text: string };
export type BStep = {
  phase: string;
  title: string;
  text: string;
  active: string[];
  move?: [string, string];
  packet?: string;
  code?: Code;
  gloss?: Gloss;
  tone?: Tone;
  end?: boolean;
  set?: Partial<Inspector>;
};
export type Option = { value: string; label: string; locked?: boolean };
export type Input = { id: string; label: string; options: Option[]; def: string };
export type Values = Record<string, string>;
export type BScenario = {
  id: string;
  name: string;
  group: Group;
  blurb: string;
  inputs: Input[];
  locked?: string;
  build: (v: Values) => BStep[];
};

export const INIT: Inspector = { record: "none", queue: "empty", limits: "none yet", cache: "empty", check: "none" };
export const GROUPS: Group[] = ["Normal", "Protection", "Failure"];

const c = (path: string, a: number, b: number): Code => ({ path, lines: [a, b] });
const ROUTE = "src/app/api/webhook/github/route.ts";
const CODE = {
  method: c("src/proxy.ts", 5, 9),
  hmac: c("src/proxy.ts", 12, 17),
  action: c(ROUTE, 26, 30),
  wip: c(ROUTE, 32, 40),
  token: c("lib/github.ts", 119, 140),
  limits: c(ROUTE, 53, 63),
  limiter: c("lib/rateLimit.ts", 8, 36),
  placeholder: c(ROUTE, 67, 70),
  cache: c(ROUTE, 71, 76),
  insert: c(ROUTE, 77, 98),
  processing: c(ROUTE, 99, 105),
  stale: c("repository/dbrepo.ts", 33, 45),
  queueAdd: c(ROUTE, 107, 127),
  retries: c("lib/queue.ts", 4, 13),
  bot: c(ROUTE, 133, 135),
  cmdFilter: c(ROUTE, 137, 139),
  cmdLimits: c(ROUTE, 158, 174),
  cmdCommit: c(ROUTE, 176, 189),
  cmdCheck: c(ROUTE, 190, 191),
  cmdQueue: c(ROUTE, 192, 205),
  concurrency: c("Worker/worker.ts", 151, 156),
  fetch: c("Worker/worker.ts", 49, 56),
  condense: c("lib/agent.ts", 168, 193),
  agents: c("Worker/worker.ts", 76, 85),
  merge: c("Worker/worker.ts", 87, 90),
  inline: c("Worker/worker.ts", 93, 139),
  deliver: c("Worker/worker.ts", 140, 146),
  summary: c("Worker/worker.ts", 147, 147),
  checkRule: c("lib/github.ts", 56, 76),
  cacheTtl: c("utils/redisutils.ts", 23, 30),
  failedHandler: c("Worker/worker.ts", 160, 185),
};

const GL = {
  hmac: { term: "HMAC", text: "A signature GitHub computes from the request body with a secret only it and the app share. A forged or altered request won't match." },
  tree: { term: "Tree SHA", text: "A fingerprint of the exact files in a commit. Two commits with identical files share one tree SHA, so identical code is recognised even across commits." },
  token: { term: "Installation token", text: "A short-lived credential GitHub issues to the app for one install. The app uses it for every call back to GitHub." },
  jobId: { term: "Job ID", text: "The queue refuses a second job with an ID it already holds. The ID is the repo plus the tree SHA." },
  backoff: { term: "Backoff", text: "Each retry waits longer than the one before, starting at 5 seconds, so a struggling service gets time to recover." },
  failOpen: { term: "Fails open", text: "If Redis itself errors, the limiter lets the request through instead of blocking reviews." },
  stale: { term: "Stale", text: "A review marked processing for more than 15 minutes is treated as abandoned, so a new request may start it again." },
  titleOnly: { term: "Title check only", text: "The skip rule reads the pull request title. It does not look at GitHub's own draft flag." },
};

const opts = (...pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }));
const intro = (text: string, phase = "Start"): BStep => ({ phase, title: "Paused at the start", text, active: [] });

/* ───────── Full workflow ───────── */
const SCORES: Record<string, number> = { low: 3, medium: 6, high: 8 };
const journey = (v: Values): BStep[] => {
  const score = v.score ?? "high";
  const crit = (v.critical ?? "no") === "yes";
  const n = SCORES[score] ?? 8;
  const result = crit ? "failure" : n >= 7 ? "success" : "neutral";
  const tone: Tone = result === "failure" ? "bad" : result === "success" ? "ok" : "warn";
  const why =
    result === "failure"
      ? "Any critical finding turns the check to failure."
      : result === "success"
        ? "A score of 7 or more with no critical finding turns the check to success."
        : "Below 7 with no critical finding: the check turns neutral.";
  return [
    intro("You install the app on a repo. From then on every event carries an installation ID. Press Next to follow one pull request.", "Setup"),
    { phase: "Intake", title: "You open a pull request", text: "Opening a PR or pushing to one is all it takes. GitHub sends a webhook to the web service.", active: ["gh", "web"], move: ["gh", "web"], packet: "webhook" },
    { phase: "Intake", title: "The signature is verified", text: "Only requests signed with the shared secret get through.", active: ["web"], code: CODE.hmac, gloss: GL.hmac },
    { phase: "Intake", title: "Only some events count", text: "Only 'opened' and 'synchronize' (a push) count. Titles marked WIP or draft are skipped.", active: ["web"], code: CODE.action },
    { phase: "Intake", title: "A short-lived token is minted", text: "The app asks GitHub for an installation token to use for calls back to GitHub.", active: ["web", "gh"], move: ["web", "gh"], packet: "token", code: CODE.token, gloss: GL.token },
    { phase: "Intake", title: "Rate limits are checked", text: "Redis counts events: up to 3 per PR and 20 per repo each minute. Extras are turned away.", active: ["web", "queue"], move: ["web", "queue"], packet: "limits", code: CODE.limits, set: { limits: "PR: 1 of 3 · repo: 1 of 20" } },
    { phase: "Intake", title: "A placeholder appears right away", text: "The bot posts a 'review in progress' comment and starts a check on the PR, so you know it's working.", active: ["web", "gh"], move: ["web", "gh"], packet: "comment", code: CODE.placeholder, set: { check: "in progress" } },
    { phase: "Intake", title: "The app looks for the same code", text: "The cache is checked first, then the database, for this tree SHA. Neither has it, so a review is needed.", active: ["web", "queue", "db"], move: ["web", "db"], packet: "tree SHA?", code: CODE.cache, gloss: GL.tree, set: { cache: "miss" } },
    { phase: "Queue", title: "A review record is saved", text: "A pending record goes into the database, unique per repo and tree SHA.", active: ["web", "db"], move: ["web", "db"], packet: "record", code: CODE.insert, set: { record: "pending" } },
    { phase: "Queue", title: "The job goes into the queue", text: "The job is added under the ID repo--treeSha and the record becomes processing. The webhook answers without waiting for the review.", active: ["web", "queue"], move: ["web", "queue"], packet: "job", code: CODE.queueAdd, gloss: GL.jobId, set: { record: "processing", queue: "1 job · repo--treeSha" } },
    { phase: "Queue", title: "The worker picks it up", text: "A separate worker process takes the job. It handles up to 3 jobs at once.", active: ["queue", "worker"], move: ["queue", "worker"], packet: "job", code: CODE.concurrency, set: { queue: "worker has it · attempt 1 of 5" } },
    { phase: "Review", title: "The worker fetches your code", text: "The diff, the PR details and the contents of the changed files come from GitHub.", active: ["worker", "gh"], move: ["gh", "worker"], packet: "diff", code: CODE.fetch },
    { phase: "Review", title: "Long files are condensed", text: "Files of 3000 characters or more are condensed by a model call before the agents read them.", active: ["worker", "ai"], move: ["worker", "ai"], packet: "condense", code: CODE.condense },
    { phase: "Review", title: "Four agents read the code in parallel", text: "Security and Performance get the diff plus file context, Style gets the diff only, and Architecture gets file context only.", active: ["worker", "ai"], move: ["worker", "ai"], packet: "4 agents", code: CODE.agents },
    { phase: "Review", title: "One pass merges the findings", text: `Duplicates are removed, each area is scored, and a short summary is written. In this run: ${n}/10, ${crit ? "with a critical finding" : "no critical finding"}.`, active: ["ai", "worker"], move: ["ai", "worker"], packet: "findings", code: CODE.merge },
    { phase: "Delivery", title: "Findings land on your lines", text: "Findings on changed lines become inline comments, each posted independently. Findings elsewhere go into the summary.", active: ["worker", "gh"], move: ["worker", "gh"], packet: "inline", code: CODE.inline },
    { phase: "Delivery", title: `The check turns ${result}`, text: `${why} The result is saved as JSON and cached for 24 hours.`, active: ["worker", "db", "queue", "gh"], move: ["worker", "db"], packet: "result", code: CODE.checkRule, tone, set: { check: result, record: "completed", cache: "hit · 24 h", queue: "job completed" } },
    { phase: "Delivery", title: "The summary comment is posted", text: "A summary comment with the scores and any findings outside the diff goes on the PR.", active: ["worker", "gh"], move: ["worker", "gh"], packet: "summary", code: CODE.summary },
    { phase: "Done", title: "The review has landed", text: `Record completed, result cached, check ${result}. The same code will now reuse this result.`, active: ["gh"], tone, end: true },
  ];
};

/* ───────── /review on demand ───────── */
const CMD_TEXT: Record<string, string> = { exact: "/review", please: "/review please", other: "looks good to me" };
const reviewCmd = (v: Values): BStep[] => {
  const text = CMD_TEXT[v.comment ?? "exact"] ?? "/review";
  const onPr = (v.where ?? "pr") === "pr";
  const bot = (v.sender ?? "human") === "bot";
  const second = (v.minute ?? "first") === "second";
  const steps: BStep[] = [
    intro("Comment /review on a pull request to run a fresh review without pushing new code. Set the inputs, then press Next."),
    { phase: "Arrives", title: "A comment arrives", text: `${bot ? "The bot itself" : "A teammate"} comments "${text}" on a ${onPr ? "pull request" : "plain issue"}.`, active: ["gh", "web"], move: ["gh", "web"], packet: "comment" },
    { phase: "Arrives", title: "The signature is verified", text: "Same check as every other event.", active: ["web"], code: CODE.hmac, gloss: GL.hmac },
  ];
  const stop = (title: string, why: string, code: Code): BStep[] => [
    { phase: "Filter", title, text: why, active: ["web"], code, tone: "warn" },
    { phase: "Outcome", title: "Nothing happens", text: "No check, no job and no comment. The queue, database and PR are untouched.", active: [], tone: "ok", end: true },
  ];
  if (bot) return [...steps, ...stop("Ignored: the bot's own comment", "The bot's own comments are ignored, so it can never reply to itself.", CODE.bot)];
  if ((v.comment ?? "exact") !== "exact") return [...steps, ...stop("Ignored: not exactly /review", "Only a comment that is exactly /review counts. Anything else is ignored.", CODE.cmdFilter)];
  if (!onPr) return [...steps, ...stop("Ignored: not a pull request", "Comments on plain issues are ignored. Only pull requests are reviewed.", CODE.cmdFilter)];
  steps.push({ phase: "Filter", title: "Accepted", text: "A new comment, on a pull request, exactly /review, not from the bot.", active: ["web"], code: CODE.cmdFilter, tone: "ok" });
  if (second) {
    steps.push(
      { phase: "Limits", title: "Turned away: already used this minute", text: "Only 1 /review per PR per minute is allowed, alongside the 20-per-repo limit. This one is turned away and nothing is queued.", active: ["web", "queue"], move: ["web", "queue"], packet: "limits", code: CODE.cmdLimits, tone: "warn", set: { limits: "/review: 2 of 1 (over)" } },
      { phase: "Outcome", title: "Nothing is queued", text: "Wait a minute and comment again.", active: [], tone: "ok", end: true },
    );
    return steps;
  }
  steps.push(
    { phase: "Limits", title: "Allowed: first /review this minute", text: "1 per PR per minute and 20 per repo. Under both limits.", active: ["web", "queue"], move: ["web", "queue"], packet: "limits", code: CODE.cmdLimits, set: { limits: "/review: 1 of 1 · repo: 1 of 20" } },
    { phase: "Prepare", title: "The latest commit is looked up", text: "The app asks GitHub for the PR's latest commit and its tree SHA.", active: ["web", "gh"], move: ["web", "gh"], packet: "latest", code: CODE.cmdCommit, gloss: GL.tree },
    { phase: "Prepare", title: "A fresh check is created", text: "A new check appears on the latest commit, so you can see the review is running.", active: ["web", "gh"], move: ["web", "gh"], packet: "check", code: CODE.cmdCheck, set: { check: "in progress", record: "untouched by /review" } },
    { phase: "Prepare", title: "The job is queued", text: "A job is added under the ID repo--treeSha for the latest commit.", active: ["web", "queue"], move: ["web", "queue"], packet: "job", code: CODE.cmdQueue, gloss: GL.jobId, set: { queue: "1 job · repo--treeSha" } },
    { phase: "Review", title: "The review runs again", text: "From here it is the same pipeline as the full workflow: the worker fetches the code, four agents read it, and the findings are merged.", active: ["queue", "worker", "ai"], move: ["worker", "ai"], packet: "4 agents", set: { queue: "worker has it · attempt 1 of 5" } },
    { phase: "Outcome", title: "A fresh review lands", text: "A fresh review is posted on the PR and the check completes.", active: ["worker", "gh"], move: ["worker", "gh"], packet: "review", tone: "ok", end: true, set: { check: "result posted", queue: "job completed" } },
  );
  return steps;
};

/* ───────── Forged request ───────── */
const forged = (v: Values): BStep[] => {
  const bad = (v.sig ?? "forged") === "forged";
  const head: BStep[] = [
    intro("Anyone on the internet can send a request to the webhook address. Pick a signature and see what the app does with it."),
    { phase: "Arrives", title: "A request arrives", text: "It says it comes from GitHub and carries a signature.", active: ["gh", "web"], move: ["gh", "web"], packet: "webhook" },
    bad
      ? { phase: "Check", title: "The signature doesn't match", text: "The app recomputes the signature from the body and its secret. It doesn't match, so the request is rejected before any work happens.", active: ["web"], code: CODE.hmac, gloss: GL.hmac, tone: "bad" }
      : { phase: "Check", title: "The signature matches", text: "The recomputed signature equals the one sent, so the request is accepted.", active: ["web"], code: CODE.hmac, gloss: GL.hmac, tone: "ok" },
  ];
  head.push(
    bad
      ? { phase: "Outcome", title: "Nothing is queued, posted or saved", text: "The queue, database and PR are untouched. A forged request can't spend model credits.", active: [], tone: "ok", end: true }
      : { phase: "Outcome", title: "The request carries on", text: "It moves on to the event filter, token, rate limits and the rest of the full workflow.", active: ["web"], tone: "ok", end: true },
  );
  return head;
};

/* ───────── Burst of events ───────── */
const burst = (v: Values): BStep[] => {
  const n = Math.max(1, Math.min(6, Number(v.events ?? 5)));
  const steps: BStep[] = [intro("Pushes can come in bursts. Pick how many events one PR sends in a minute. Assumes no other PRs in the repo are busy.")];
  let allowed = 0;
  for (let k = 1; k <= n; k++) {
    const ok = k <= 3;
    if (ok) allowed++;
    steps.push({
      phase: "Limits",
      title: ok ? `Event ${k}: allowed` : `Event ${k}: turned away`,
      text: ok ? `PR count ${k} of 3 this minute, repo count ${k} of 20. Under both limits, so it carries on to the queue.` : `PR count ${k} of 3 this minute. Over the limit, so it is turned away and nothing more happens.`,
      active: ["web", "queue"],
      move: ["web", "queue"],
      packet: "limits",
      code: CODE.limits,
      tone: ok ? "ok" : "bad",
      set: { limits: ok ? `PR: ${k} of 3 · repo: ${k} of 20` : `PR: ${k} of 3 (over)`, queue: `${allowed} job${allowed === 1 ? "" : "s"} allowed` },
    });
  }
  steps.push({
    phase: "Outcome",
    title: `${allowed} of ${n} events reached the queue`,
    text: `The queue only ever sees allowed jobs. The window resets after a minute.`,
    active: ["queue"],
    code: CODE.limiter,
    gloss: GL.failOpen,
    tone: "ok",
    end: true,
  });
  return steps;
};

/* ───────── Same code pushed again ───────── */
const sameCode = (v: Values): BStep[] => {
  const mode = v.tree ?? "same-cache";
  const same = mode !== "different";
  const steps: BStep[] = [
    intro("The review is keyed to the code, not the commit. Pick what the new push contains."),
    { phase: "Arrives", title: "A push arrives", text: same ? "A new commit is pushed, but its files are identical to code already reviewed: the same tree SHA." : "A new commit is pushed with different files: a new tree SHA.", active: ["gh", "web"], move: ["gh", "web"], packet: "webhook", gloss: GL.tree },
    { phase: "Arrives", title: "The placeholder and check are created", text: "As in the full workflow, the bot posts its 'in progress' comment and starts a check before looking anything up.", active: ["web", "gh"], move: ["web", "gh"], packet: "comment", code: CODE.placeholder, set: { check: "in progress" } },
  ];
  if (mode === "same-cache") {
    steps.push(
      { phase: "Lookup", title: "The cache has it", text: "Redis holds a result for this repo and tree SHA, saved within the last 24 hours.", active: ["web", "queue"], move: ["web", "queue"], packet: "tree SHA?", code: CODE.cache, tone: "ok", set: { cache: "hit · 24 h" } },
      { phase: "Outcome", title: "The saved result is reused", text: "The saved review completes the check. No job is queued and no model is called.", active: ["web", "gh"], move: ["web", "gh"], packet: "check", tone: "ok", end: true, set: { check: "from saved result" } },
    );
  } else if (mode === "same-db") {
    steps.push(
      { phase: "Lookup", title: "The cache has expired", text: "The cache keeps a result for 24 hours, and this one is older. Redis has nothing.", active: ["web", "queue"], move: ["web", "queue"], packet: "tree SHA?", code: CODE.cacheTtl, set: { cache: "miss (expired)" } },
      { phase: "Lookup", title: "The database has it", text: "A record for this repo and tree SHA is marked completed, with its saved result.", active: ["web", "db"], move: ["web", "db"], packet: "tree SHA?", code: CODE.stale, tone: "ok", set: { record: "completed" } },
      { phase: "Outcome", title: "The saved result is reused and re-cached", text: "The result completes the check and goes back into the cache. No new review runs.", active: ["web", "gh", "queue"], move: ["web", "gh"], packet: "check", tone: "ok", end: true, set: { check: "from saved result", cache: "hit · refilled" } },
    );
  } else {
    steps.push(
      { phase: "Lookup", title: "The cache has nothing", text: "No result for this tree SHA.", active: ["web", "queue"], move: ["web", "queue"], packet: "tree SHA?", code: CODE.cache, set: { cache: "miss" } },
      { phase: "Lookup", title: "The database has nothing", text: "No record for this tree SHA either, so this is new code.", active: ["web", "db"], move: ["web", "db"], packet: "tree SHA?", code: CODE.stale },
      { phase: "Outcome", title: "A new review starts", text: "A pending record is saved, a job is queued under repo--treeSha, and the review runs as in the full workflow.", active: ["web", "db", "queue"], move: ["web", "queue"], packet: "job", code: CODE.queueAdd, gloss: GL.jobId, tone: "info", end: true, set: { record: "processing", queue: "1 job · repo--treeSha" } },
    );
  }
  return steps;
};

/* ───────── Already being reviewed ───────── */
const inProgress = (v: Values): BStep[] => {
  const m = Number(v.started ?? 5);
  const fresh = m <= 15;
  const steps: BStep[] = [
    intro("The same code can be pushed again while its review is still running. Pick how long ago that review started."),
    { phase: "Arrives", title: "The same code arrives again", text: `A review of this exact code started ${m} minutes ago and is still marked processing.`, active: ["gh", "web"], move: ["gh", "web"], packet: "webhook", set: { record: `processing · ${m} min`, queue: "1 job running", check: "none" } },
    { phase: "Arrives", title: "The placeholder and check are created", text: "The new push gets its own 'in progress' comment and check first.", active: ["web", "gh"], move: ["web", "gh"], packet: "comment", code: CODE.placeholder, set: { check: "in progress" } },
    { phase: "Lookup", title: "The cache has nothing yet", text: "The first review hasn't finished, so nothing is cached.", active: ["web", "queue"], move: ["web", "queue"], packet: "tree SHA?", code: CODE.cache, set: { cache: "miss" } },
    { phase: "Lookup", title: "The database has a processing record", text: `The record for this tree SHA says processing, last updated ${m} minutes ago. The app compares that with the 15-minute threshold.`, active: ["web", "db"], move: ["web", "db"], packet: "tree SHA?", code: CODE.stale, gloss: GL.stale },
  ];
  if (fresh) {
    steps.push({ phase: "Outcome", title: "Answered: already queued", text: `${m} minutes is under 15, so the record is fresh. The web service answers 'already queued' and adds nothing.`, active: ["web"], code: CODE.processing, tone: "ok", end: true });
  } else {
    steps.push(
      { phase: "Decision", title: "The record counts as stale", text: `${m} minutes is over 15, so the earlier attempt is treated as abandoned.`, active: ["web", "db"], code: CODE.stale, gloss: GL.stale, tone: "warn" },
      { phase: "Outcome", title: "The review starts again", text: "The record is reset to pending, then set to processing, and the job is queued again.", active: ["web", "db", "queue"], move: ["web", "queue"], packet: "job", code: CODE.queueAdd, tone: "info", end: true, set: { record: "pending → processing", queue: "1 job · repo--treeSha" } },
    );
  }
  return steps;
};

/* ───────── Draft or WIP skipped ───────── */
const TITLES: Record<string, string> = { normal: "Add login page", wip1: "[WIP] Add login page", wip2: "wip: login page", draft: "draft: login page", skip: "[skip-review] hotfix" };
const draftWip = (v: Values): BStep[] => {
  const title = TITLES[v.title ?? "normal"] ?? TITLES.normal;
  const t = title.toLowerCase();
  const skipped = t.includes("[wip]") || t.includes("[skip-review]") || t.startsWith("wip:") || t.startsWith("draft:");
  return [
    intro("Work in progress shouldn't cost a review. Pick a pull request title."),
    { phase: "Arrives", title: "A pull request is opened", text: `The title is "${title}".`, active: ["gh", "web"], move: ["gh", "web"], packet: "webhook" },
    skipped
      ? { phase: "Filter", title: "The title matches a skip pattern", text: "[WIP] or [skip-review] anywhere in the title, or a title starting with wip: or draft:, means skip.", active: ["web"], code: CODE.wip, gloss: GL.titleOnly, tone: "warn" }
      : { phase: "Filter", title: "No skip pattern matches", text: "The title has no [WIP], [skip-review], wip: or draft:.", active: ["web"], code: CODE.wip, gloss: GL.titleOnly, tone: "ok" },
    skipped
      ? { phase: "Outcome", title: "The review is skipped", text: "No comment, check or job is created. Rename the PR to start a review.", active: [], tone: "ok", end: true }
      : { phase: "Outcome", title: "The review goes ahead", text: "It carries on to the token, rate limits, placeholder and queue, as in the full workflow.", active: ["web"], tone: "ok", end: true },
  ];
};

/* ───────── Ignored events ───────── */
const EVENTS: Record<string, { label: string; kind: "get" | "pr-ok" | "pr-no" | "cmd-ok" | "cmd-near" | "cmd-issue" | "cmd-bot"; what: string }> = {
  opened: { label: "PR opened", kind: "pr-ok", what: "A pull request is opened." },
  sync: { label: "PR updated (new commit)", kind: "pr-ok", what: "A new commit is pushed to a pull request." },
  closed: { label: "PR closed", kind: "pr-no", what: "A pull request is closed." },
  labeled: { label: "PR labeled", kind: "pr-no", what: "A label is added to a pull request." },
  cmd: { label: "Comment: /review on a PR", kind: "cmd-ok", what: "Someone comments /review on a pull request." },
  near: { label: "Comment: /review please", kind: "cmd-near", what: 'Someone comments "/review please" on a pull request.' },
  issue: { label: "Comment: /review on an issue", kind: "cmd-issue", what: "Someone comments /review on a plain issue." },
  bot: { label: "Comment by the bot", kind: "cmd-bot", what: "The bot posts a comment on a pull request." },
  get: { label: "A GET request", kind: "get", what: "A browser or script opens the webhook address with GET." },
};
const ignored = (v: Values): BStep[] => {
  const e = EVENTS[v.event ?? "closed"] ?? EVENTS.closed;
  const steps: BStep[] = [intro("GitHub sends many kinds of events. Only a few start a review. Pick one."), { phase: "Arrives", title: "A request arrives", text: e.what, active: ["gh", "web"], move: ["gh", "web"], packet: e.kind === "get" ? "GET" : "webhook" }];
  const done = (title: string, text: string): BStep => ({ phase: "Outcome", title, text, active: [], tone: "ok", end: true });
  if (e.kind === "get") return [...steps, { phase: "Filter", title: "Rejected: not a POST", text: "The webhook only accepts POST. Anything else gets 405, 'Method is not permitted'.", active: ["web"], code: CODE.method, tone: "warn" }, done("Nothing happens", "No work is done and nothing is queued.")];
  steps.push({ phase: "Check", title: "The signature is verified", text: "A valid signature is needed first, whatever the event.", active: ["web"], code: CODE.hmac, gloss: GL.hmac });
  switch (e.kind) {
    case "pr-ok":
      steps.push({ phase: "Filter", title: "Counted: this starts a review", text: "'opened' and 'synchronize' (a push) are the two pull request actions that count.", active: ["web"], code: CODE.action, tone: "ok" }, { phase: "Outcome", title: "It carries on", text: "From here: title check, token, rate limits, placeholder and queue, as in the full workflow.", active: ["web"], tone: "ok", end: true });
      break;
    case "pr-no":
      steps.push({ phase: "Filter", title: "Ignored: not opened or synchronize", text: "Any other pull request action gets a quick 'ok' and no work.", active: ["web"], code: CODE.action, tone: "warn" }, done("Nothing happens", "No comment, check or job."));
      break;
    case "cmd-ok":
      steps.push({ phase: "Filter", title: "Counted: this starts a fresh review", text: "A new comment, on a PR, exactly /review, not from the bot.", active: ["web"], code: CODE.cmdFilter, tone: "ok" }, { phase: "Outcome", title: "It carries on", text: "From here: the /review limits, the latest commit, a fresh check and a queued job. Open the '/review on demand' case to step through it.", active: ["web"], tone: "ok", end: true });
      break;
    case "cmd-near":
      steps.push({ phase: "Filter", title: "Ignored: not exactly /review", text: "The comment must be exactly /review. Extra words mean it is ignored.", active: ["web"], code: CODE.cmdFilter, tone: "warn" }, done("Nothing happens", "No check, job or comment."));
      break;
    case "cmd-issue":
      steps.push({ phase: "Filter", title: "Ignored: not a pull request", text: "Comments on plain issues are ignored. Only pull requests are reviewed.", active: ["web"], code: CODE.cmdFilter, tone: "warn" }, done("Nothing happens", "No check, job or comment."));
      break;
    case "cmd-bot":
      steps.push({ phase: "Filter", title: "Ignored: the bot's own comment", text: "The bot's comments are dropped first, so it can never reply to itself.", active: ["web"], code: CODE.bot, tone: "warn" }, done("Nothing happens", "No loop: the bot never triggers itself."));
      break;
  }
  return steps;
};

/* ───────── A job fails ───────── */
const jobFails = (v: Values): BStep[] => {
  const win = v.succeeds ?? "3";
  const max = win === "none" ? 5 : Number(win);
  const steps: BStep[] = [
    intro("Models and APIs fail sometimes. Pick which attempt finally succeeds, or none, and watch the queue retry with growing waits."),
    { phase: "Queue", title: "The job is queued", text: "The webhook has already answered. The job waits for the worker, with up to 5 attempts allowed.", active: ["web", "queue"], move: ["web", "queue"], packet: "job", code: CODE.retries, set: { record: "processing", queue: "waiting · attempt 0 of 5", check: "in progress" } },
  ];
  for (let k = 1; k <= max; k++) {
    if (win !== "none" && k === max) {
      steps.push({ phase: "Retry", title: `Attempt ${k} succeeds`, text: `The review runs from fetching the code to posting the summary, exactly as in the full workflow.${k > 1 ? " The earlier failures cost only time." : ""}`, active: ["queue", "worker", "ai", "gh"], move: ["worker", "gh"], packet: "review", code: CODE.deliver, tone: "ok", end: true, set: { queue: "job completed", record: "completed", check: "result posted" } });
    } else if (k === 5) {
      steps.push({ phase: "Retry", title: "Attempt 5 fails: recorded as failed", text: "No attempts are left. The record is marked failed in the database, so the outcome is on file.", active: ["worker", "db"], move: ["worker", "db"], packet: "failed", code: CODE.failedHandler, tone: "bad", end: true, set: { queue: "failed · 5 of 5", record: "failed" } });
    } else {
      steps.push({ phase: "Retry", title: `Attempt ${k} fails`, text: k === 1 ? "Something throws inside the worker, for example a GitHub call or the file-condense model call errors. The job goes back to wait." : "It fails again. The job waits a little longer than last time, then tries again.", active: ["worker", "queue"], move: ["worker", "queue"], packet: "retry", code: CODE.retries, gloss: GL.backoff, tone: "warn", set: { queue: `waiting to retry · attempt ${k} of 5` } });
    }
  }
  return steps;
};

/* ───────── Locked (coming soon) ───────── */
const none = (): BStep[] => [];
export const SCENARIOS: BScenario[] = [
  {
    id: "journey", name: "Full workflow", group: "Normal",
    blurb: "Follow one pull request from your repo to the review on your lines. Set how the review turns out.",
    inputs: [
      { id: "score", label: "Final score", def: "high", options: opts(["low", "Low · 3/10"], ["medium", "Medium · 6/10"], ["high", "High · 8/10"]) },
      { id: "critical", label: "Critical finding", def: "no", options: opts(["no", "None"], ["yes", "One critical"]) },
    ],
    build: journey,
  },
  {
    id: "review-cmd", name: "/review on demand", group: "Normal",
    blurb: "Comment /review to get a fresh review without pushing new code.",
    inputs: [
      { id: "comment", label: "Comment text", def: "exact", options: opts(["exact", "/review"], ["please", "/review please"], ["other", "looks good to me"]) },
      { id: "where", label: "Where", def: "pr", options: opts(["pr", "On a pull request"], ["issue", "On a plain issue"]) },
      { id: "sender", label: "Sender", def: "human", options: opts(["human", "A teammate"], ["bot", "The bot itself"]) },
      { id: "minute", label: "Times this minute", def: "first", options: opts(["first", "First time"], ["second", "Second time"]) },
      { id: "code", label: "Code since last review", def: "changed", options: [{ value: "changed", label: "Changed" }, { value: "unchanged", label: "Unchanged · coming soon", locked: true }] },
    ],
    build: reviewCmd,
  },
  {
    id: "forged", name: "Forged request", group: "Protection",
    blurb: "A request that only pretends to be GitHub.",
    inputs: [{ id: "sig", label: "Signature", def: "forged", options: opts(["valid", "Valid"], ["forged", "Forged"]) }],
    build: forged,
  },
  {
    id: "burst", name: "Burst of events", group: "Protection",
    blurb: "One PR sends many events in a minute. Limits: 3 per PR and 20 per repo.",
    inputs: [{ id: "events", label: "Events in a minute", def: "5", options: opts(["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"]) }],
    build: burst,
  },
  {
    id: "same-code", name: "Same code pushed again", group: "Protection",
    blurb: "The same files arrive in a new commit. Does a second review run?",
    inputs: [{ id: "tree", label: "The new push", def: "same-cache", options: opts(["same-cache", "Same code, cached"], ["same-db", "Same code, cache expired"], ["different", "Different code"]) }],
    build: sameCode,
  },
  {
    id: "in-progress", name: "Already being reviewed", group: "Protection",
    blurb: "The same code arrives while its review is still running.",
    inputs: [{ id: "started", label: "First review started", def: "5", options: opts(["5", "5 min ago"], ["14", "14 min ago"], ["16", "16 min ago"], ["30", "30 min ago"]) }],
    build: inProgress,
  },
  {
    id: "draft-wip", name: "Draft or WIP skipped", group: "Protection",
    blurb: "Work in progress is skipped by its title.",
    inputs: [{ id: "title", label: "PR title", def: "wip1", options: opts(["normal", "Add login page"], ["wip1", "[WIP] Add login page"], ["wip2", "wip: login page"], ["draft", "draft: login page"], ["skip", "[skip-review] hotfix"]) }],
    build: draftWip,
  },
  {
    id: "ignored", name: "Ignored events", group: "Protection",
    blurb: "Most GitHub events don't start a review. See which do.",
    inputs: [{ id: "event", label: "Event", def: "closed", options: Object.entries(EVENTS).map(([value, e]) => ({ value, label: e.label })) }],
    build: ignored,
  },
  {
    id: "job-fails", name: "A job fails", group: "Failure",
    blurb: "A job throws. The queue retries with growing waits, up to 5 attempts.",
    inputs: [{ id: "succeeds", label: "Succeeds on", def: "3", options: opts(["1", "Attempt 1"], ["2", "Attempt 2"], ["3", "Attempt 3"], ["4", "Attempt 4"], ["5", "Attempt 5"], ["none", "Never"]) }],
    build: jobFails,
  },
  {
    id: "agent-fails", name: "One agent fails", group: "Failure",
    blurb: "Pick which of the four agents fails and see the other three still deliver.",
    locked: "Coming soon. You will pick which of the four agents fails and watch the other three still deliver their findings.",
    inputs: [{ id: "agent", label: "Failing agent", def: "security", options: [{ value: "security", label: "Security", locked: true }, { value: "performance", label: "Performance", locked: true }, { value: "style", label: "Style", locked: true }, { value: "architecture", label: "Architecture", locked: true }] }],
    build: none,
  },
  {
    id: "merge-fails", name: "Merge fails", group: "Failure",
    blurb: "The step that combines the four agents' findings fails.",
    locked: "Coming soon. You will make the merge step fail and see what is recorded, what is cached and what the check shows.",
    inputs: [{ id: "merge", label: "Merge step", def: "fails", options: [{ value: "ok", label: "Succeeds", locked: true }, { value: "fails", label: "Fails", locked: true }] }],
    build: none,
  },
  {
    id: "comment-fails", name: "A comment can't post", group: "Failure",
    blurb: "One inline comment can't be posted to GitHub.",
    locked: "Coming soon. You will pick which inline comment fails to post and see where its finding goes.",
    inputs: [{ id: "which", label: "Failing comment", def: "first", options: [{ value: "first", label: "The first", locked: true }, { value: "middle", label: "A middle one", locked: true }, { value: "last", label: "The last", locked: true }] }],
    build: none,
  },
];

export const defaults = (s: BScenario): Values => Object.fromEntries(s.inputs.map((i) => [i.id, i.def]));

export type Decision = { decision: string; reason: string; tradeoff: string; shownIn: string; shownLabel: string };
export const DECISIONS: Decision[] = [
  { decision: "A queue instead of working inside the webhook", reason: "GitHub expects a fast reply, and reviews take longer.", tradeoff: "Another moving part, with retries to tune.", shownIn: "job-fails", shownLabel: "A job fails" },
  { decision: "A separate long-running worker", reason: "AI calls outlast typical serverless limits, and each side can scale and fail on its own.", tradeoff: "Two services to run.", shownIn: "journey", shownLabel: "Full workflow" },
  { decision: "A GitHub App instead of a personal token", reason: "It has its own bot identity, short-lived installation tokens, and works on any repo it is installed on.", tradeoff: "A more involved setup.", shownIn: "journey", shownLabel: "Full workflow" },
  { decision: "Four focused agents instead of one prompt", reason: "Tight instructions per area, and total time follows the slowest agent.", tradeoff: "Four model calls per review.", shownIn: "journey", shownLabel: "Full workflow" },
  { decision: "Duplicates detected by tree SHA", reason: "Identical code shares a tree SHA, even across different commits.", tradeoff: "A reworded but equivalent change counts as new code.", shownIn: "same-code", shownLabel: "Same code pushed again" },
];
