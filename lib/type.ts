export type Finding = {
  file: string;
  line?: number;
  severity: "critical" | "warning" | "info";
  message: string;
};

export type AgentResult = {
  agent: "security" | "performance" | "style" | "architecture";
  findings: Finding[];
};
export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
};
export type Severity = "critical" | "warning" | "info";

export interface BotComment {
  file: string;
  line: number;
  severity: Severity;
  icon: string;
  label: string;
  message: string;
}

export interface TypingCommentProps {
  comment: BotComment;
  delay: number;
}

export interface ReviewResult {
  overallScore: number;
  summary: string;
  findings: unknown[];
  breakdown: {
    security: number;
    performance: number;
    style: number;
    architecture: number;
  };
}
export type RateLimitResult = {
  limited: boolean;
  retryAfter: number;
  remaining: number;
};

export type NewWaiter = {
  prNumber: number;
  commitsha: string;
  checkRunId: number;
  commentId?: number;
};
export type PRFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
};
export type PullRequestDetails = {
  title: string;
  description: string;
  author: string;
  baseBranch: string;
  headBranch: string;
};
