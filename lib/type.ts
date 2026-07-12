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
