import { GoogleGenerativeAI } from "@google/generative-ai";
import { AgentResult, Finding } from "./type";
import { AGGREGATOR_PROMPT } from "./prompt";
const gemini = new GoogleGenerativeAI(process.env.Gemini_Key!);
export type AggregatorReview = {
  overallScore: number;
  summary: string;
  findings: Finding[];
  breakdown: {
    security: number;
    performance: number;
    style: number;
    architecture: number;
  };
};
export async function runAggregator(
  agentResults: AgentResult[],
  prTitle: string,
): Promise<AggregatorReview> {
  try {
    const agentOutput = agentResults
      .map(
        (r) =>
          `## ${r.agent.toUpperCase()} AGENT\n${JSON.stringify(r.findings, null, 2)}`,
      )
      .join("\n\n");

    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(
      `${AGGREGATOR_PROMPT}\n\nPR Title: ${prTitle}\n\nAgent Findings:\n${agentOutput}`,
    );

    const raw = result.response.text();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      overallScore: parsed.overallScore ?? 0,
      summary: parsed.summary ?? "",
      findings: parsed.findings ?? [],
      breakdown: parsed.breakdown ?? {
        security: 0,
        performance: 0,
        style: 0,
        architecture: 0,
      },
    };
  } catch (err) {
    console.error("[Aggregator] failed:", err);
    return {
      overallScore: 0,
      summary: "Aggregation failed",
      findings: [],
      breakdown: { security: 0, performance: 0, style: 0, architecture: 0 },
    };
  }
}
