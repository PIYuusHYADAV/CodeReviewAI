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
