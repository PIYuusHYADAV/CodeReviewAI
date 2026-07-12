import Groq from "groq-sdk";
import { AgentResult, Finding } from "./type";
import { PRFile } from "./github";
import {
  ARCHITECTURE_PROMPT,
  SECURITY_PROMPT,
  PERFORMANCE_PROMPT,
  STYLE_PROMPT,
} from "./prompt";

const groq = new Groq({ apiKey: process.env.Groq_Token! });
function buildDiffContext(diff: PRFile[]): string {
  return diff
    .map(
      (f) =>
        `### ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})\n${f.patch}`,
    )
    .join("\n\n");
}

function safeParseFindings(raw: string): Finding[] {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed.findings) ? parsed.findings : [];
  } catch {
    return [];
  }
}

export async function runSecurityAgent(
  diff: PRFile[],
  prTitle: string,
): Promise<AgentResult> {
  const diffContext = buildDiffContext(diff);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SECURITY_PROMPT },
        {
          role: "user",
          content: `PR Title: ${prTitle}\n\nDiff:\n${diffContext}`,
        },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? '{"findings":[]}';
    return { agent: "security", findings: safeParseFindings(raw) };
  } catch (err) {
    console.error("[Agent:security] failed:", err);
    return { agent: "security", findings: [] };
  }
}

export async function runPerformanceAgent(
  diff: PRFile[],
  prTitle: string,
): Promise<AgentResult> {
  const diffContext = buildDiffContext(diff);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: PERFORMANCE_PROMPT },
        {
          role: "user",
          content: `PR Title: ${prTitle}\n\nDiff:\n${diffContext}`,
        },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? '{"findings":[]}';
    return { agent: "performance", findings: safeParseFindings(raw) };
  } catch (err) {
    console.error("[Agent:performance] failed:", err);
    return { agent: "performance", findings: [] };
  }
}

export async function runStyleAgent(
  diff: PRFile[],
  prTitle: string,
): Promise<AgentResult> {
  const diffContext = buildDiffContext(diff);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: STYLE_PROMPT },
        {
          role: "user",
          content: `PR Title: ${prTitle}\n\nDiff:\n${diffContext}`,
        },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? '{"findings":[]}';
    return { agent: "style", findings: safeParseFindings(raw) };
  } catch (err) {
    console.error("[Agent:style] failed:", err);
    return { agent: "style", findings: [] };
  }
}

export async function runArchitectureAgent(
  diff: PRFile[],
  fileMetadata: {
    filename: string;

    status: string;
    contentLength: number;
    content: string;
  }[],
  prTitle: string,
): Promise<AgentResult> {
  try {
    const context = fileMetadata
      .map((f) => `### ${f.filename}\n${f.content}`)
      .join("\n\n");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: ARCHITECTURE_PROMPT },
        {
          role: "user",
          content: `PR Title: ${prTitle}\n\nFull file context:\n${context}`,
        },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? '{"findings":[]}';
    return { agent: "architecture", findings: safeParseFindings(raw) };
  } catch (err) {
    console.error("[Agent:architecture] failed:", err);
    return { agent: "architecture", findings: [] };
  }
}
export async function compressFileContent(
  filename: string,
  content: string,
  patch: string,
): Promise<string> {
  if (content.length < 3000) return content;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a code summarizer. Given a file and its diff, extract only the most relevant parts for code review — class definitions, method signatures, changed logic, imports. Remove boilerplate, comments, and unchanged simple code. Keep the output under 2000 characters.`,
        },
        {
          role: "user",
          content: `File: ${filename}\n\nDiff:\n${patch}\n\nFull content:\n${content.slice(0, 8000)}`,
        },
      ],
      temperature: 0.1,
    });
    return completion.choices[0]?.message?.content ?? content.slice(0, 3000);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unidentified Error");
  }
}
