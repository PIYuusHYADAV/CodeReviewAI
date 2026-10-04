import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AggregatorReview } from "./aggregator";
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
export function cachedComment(r: AggregatorReview) {
  const emoji = (s: string) =>
    s === "critical" ? "🔴" : s === "warning" ? "🟡" : "🔵";
  const list = r.findings
    .map(
      (f) =>
        `- ${emoji(f.severity)} **${f.severity.toUpperCase()}** — \`${f.file}${f.line ? `:${f.line}` : ""}\` — ${f.message}`,
    )
    .join("\n");
  return `${r.summary}\n\n---\n\n### Findings (saved result for identical code)\n\n${list || "No findings."}`;
}
