"use client";
import { useState, useEffect } from "react";
import { TypingCommentProps } from "../../lib/type";
const BOT_COMMENTS = [
  {
    file: "authController.ts",
    line: 47,
    severity: "critical",
    icon: "🔴",
    label: "CRITICAL",
    message: "JWT secret hardcoded — move to environment variable immediately",
  },
  {
    file: "userService.ts",
    line: 112,
    severity: "warning",
    icon: "🟡",
    label: "WARNING",
    message: "N+1 query inside loop — fetch all users in a single query",
  },
  {
    file: "httpServer.java",
    line: 89,
    severity: "info",
    icon: "🔵",
    label: "INFO",
    message: "handleByIdPut is doing too much — consider breaking it down",
  },
];

function TypingComment({ comment, delay }: TypingCommentProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!visible) return null;

  return (
    <div
      style={{
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 8,
        animation: "slideIn 0.3s ease",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #238636, #1a7f37)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        🤖
      </div>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span style={{ color: "#58a6ff", fontSize: 13, fontWeight: 600 }}>
            aicodereview001
          </span>
          <span
            style={{
              background: "#388bfd26",
              color: "#79c0ff",
              fontSize: 11,
              padding: "1px 6px",
              borderRadius: 20,
              border: "1px solid #388bfd",
            }}
          >
            bot
          </span>
          <span style={{ color: "#848d97", fontSize: 12 }}>just now</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{comment.icon}</span>
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color:
                  comment.severity === "critical"
                    ? "#f85149"
                    : comment.severity === "warning"
                      ? "#e3b341"
                      : "#58a6ff",
                marginRight: 6,
              }}
            >
              [{comment.label}]
            </span>
            <code
              style={{
                background: "#21262d",
                color: "#79c0ff",
                fontSize: 11,
                padding: "1px 5px",
                borderRadius: 4,
                marginRight: 6,
              }}
            >
              {comment.file}:{comment.line}
            </code>
            <span style={{ color: "#c9d1d9", fontSize: 13 }}>
              {comment.message}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStarted(true), 800);
    const t2 = setTimeout(() => setShowComments(true), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#c9d1d9",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes scanline {
          from { transform: translateY(-100%); }
          to { transform: translateY(100vh); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        button { cursor: pointer; border: none; outline: none; }
      `}</style>

      {/* Nav */}
      <nav
        style={{
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #21262d",
          position: "sticky",
          top: 0,
          background: "#0d1117",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #238636, #1a7f37)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🤖
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#f0f6fc" }}>
            CodeReview AI
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="#how" style={{ color: "#8b949e", fontSize: 14 }}>
            How it works
          </a>
          <a href="#agents" style={{ color: "#8b949e", fontSize: 14 }}>
            Agents
          </a>
          <a
            href="https://github.com/apps/aicodereview001"
            target="_blank"
            style={{
              background: "#238636",
              color: "#fff",
              padding: "7px 18px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Install Free →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "80px 40px 60px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 60,
          alignItems: "center",
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#238636" + "22",
              border: "1px solid #238636",
              borderRadius: 20,
              padding: "4px 14px",
              fontSize: 12,
              color: "#3fb950",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                animation: "pulse 2s infinite",
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#3fb950",
              }}
            ></span>
            Live on GitHub — install in seconds
          </div>

          <h1
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#f0f6fc",
              marginBottom: 20,
              letterSpacing: -1,
            }}
          >
            Your AI code
            <br />
            reviewer that
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #238636, #3fb950)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              never sleeps.
            </span>
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "#8b949e",
              lineHeight: 1.6,
              marginBottom: 36,
              maxWidth: 440,
            }}
          >
            Open a PR. Four specialized AI agents review it in parallel —
            security, performance, style, and architecture — and post inline
            comments in seconds.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="https://github.com/apps/aicodereview001"
              target="_blank"
              style={{
                background: "#238636",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Install on GitHub →
            </a>
            <a
              href="https://github.com/PIYuusHYADAV/CodeReviewAI"
              target="_blank"
              style={{
                background: "transparent",
                color: "#c9d1d9",
                padding: "12px 28px",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                border: "1px solid #30363d",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              View Source
            </a>
          </div>

          <div style={{ display: "flex", gap: 32, marginTop: 40 }}>
            {[
              { num: "4", label: "Parallel agents" },
              { num: "<30s", label: "Review time" },
              { num: "100%", label: "Automatic" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{ fontSize: 28, fontWeight: 800, color: "#f0f6fc" }}
                >
                  {s.num}
                </div>
                <div style={{ fontSize: 13, color: "#8b949e" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Live PR Demo */}
        <div
          style={{
            background: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* PR Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #21262d",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                background: "#238636",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>⬡</span> Open
            </div>
            <span style={{ color: "#c9d1d9", fontWeight: 600, fontSize: 14 }}>
              feat: add user authentication
            </span>
          </div>

          {/* Status */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #21262d",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {started ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#3fb950",
                  fontSize: 13,
                }}
              >
                <span>✓</span>
                <span style={{ fontWeight: 600 }}>CodeReview AI</span>
                <span style={{ color: "#8b949e" }}>
                  — Score 6.8/10 · 1 critical · 2 warnings
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#e3b341",
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    animation: "pulse 1s infinite",
                    display: "inline-block",
                  }}
                >
                  ⏳
                </span>
                <span style={{ fontWeight: 600 }}>CodeReview AI</span>
                <span style={{ color: "#8b949e" }}>
                  — Review in progress...
                </span>
              </div>
            )}
          </div>

          {/* Comments */}
          <div style={{ padding: 16 }}>
            <div
              style={{
                color: "#8b949e",
                fontSize: 12,
                marginBottom: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Inline comments
            </div>
            {showComments &&
              BOT_COMMENTS.map((c, i) => (
                <TypingComment key={i} comment={c} delay={i * 600} />
              ))}
            {!showComments && (
              <div
                style={{
                  color: "#484f58",
                  fontSize: 13,
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                Agents analyzing...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        style={{
          borderTop: "1px solid #21262d",
          padding: "80px 40px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#f0f6fc",
              marginBottom: 12,
            }}
          >
            How it works
          </h2>
          <p style={{ color: "#8b949e", fontSize: 16 }}>
            Zero config. Zero manual triggers. Just open a PR.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}
        >
          {[
            {
              step: "01",
              icon: "⬡",
              title: "Open a PR",
              desc: "Push code and open a pull request like you normally would. Nothing else needed.",
            },
            {
              step: "02",
              icon: "⚡",
              title: "Webhook fires",
              desc: "GitHub instantly notifies CodeReview AI. Bot posts a placeholder comment in under 2 seconds.",
            },
            {
              step: "03",
              icon: "🤖",
              title: "4 agents run",
              desc: "Security, Performance, Style, and Architecture agents analyze your code in parallel via Groq.",
            },
            {
              step: "04",
              icon: "💬",
              title: "Comments appear",
              desc: "Findings posted as inline comments anchored to exact lines. Summary updates automatically.",
            },
          ].map((s) => (
            <div
              key={s.step}
              style={{
                background: "#161b22",
                border: "1px solid #21262d",
                borderRadius: 10,
                padding: 24,
              }}
            >
              <div
                style={{
                  color: "#238636",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 12,
                  letterSpacing: 1,
                }}
              >
                {s.step}
              </div>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
              <div
                style={{
                  fontWeight: 700,
                  color: "#f0f6fc",
                  marginBottom: 8,
                  fontSize: 16,
                }}
              >
                {s.title}
              </div>
              <div style={{ color: "#8b949e", fontSize: 14, lineHeight: 1.6 }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Agents */}
      <section
        id="agents"
        style={{
          borderTop: "1px solid #21262d",
          padding: "80px 40px",
          background: "#010409",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#f0f6fc",
                marginBottom: 12,
              }}
            >
              4 specialized agents
            </h2>
            <p style={{ color: "#8b949e", fontSize: 16 }}>
              One focused prompt per dimension. All running in parallel.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 20,
            }}
          >
            {[
              {
                icon: "🔒",
                name: "Security",
                color: "#f85149",
                bg: "#f8514922",
                checks: [
                  "Hardcoded secrets & API keys",
                  "SQL / command injection",
                  "Auth bypass vulnerabilities",
                  "Exposed sensitive data in logs",
                ],
              },
              {
                icon: "⚡",
                name: "Performance",
                color: "#e3b341",
                bg: "#e3b34122",
                checks: [
                  "N+1 database queries",
                  "Memory leaks",
                  "Blocking I/O operations",
                  "Inefficient algorithms",
                ],
              },
              {
                icon: "✏️",
                name: "Style",
                color: "#58a6ff",
                bg: "#58a6ff22",
                checks: [
                  "Poor naming conventions",
                  "Dead & unreachable code",
                  "Missing error handling",
                  "Magic numbers & strings",
                ],
              },
              {
                icon: "🏛️",
                name: "Architecture",
                color: "#bc8cff",
                bg: "#bc8cff22",
                checks: [
                  "SOLID principle violations",
                  "Tight coupling",
                  "God classes & functions",
                  "Scalability concerns",
                ],
              },
            ].map((a) => (
              <div
                key={a.name}
                style={{
                  background: "#161b22",
                  border: `1px solid ${a.color}44`,
                  borderRadius: 10,
                  padding: 28,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: a.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#f0f6fc",
                        fontSize: 18,
                      }}
                    >
                      {a.name} Agent
                    </div>
                    <div style={{ fontSize: 12, color: "#8b949e" }}>
                      Groq LLaMA 3.3-70b
                    </div>
                  </div>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {a.checks.map((c) => (
                    <div
                      key={c}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 14,
                        color: "#8b949e",
                      }}
                    >
                      <span style={{ color: a.color, fontSize: 12 }}>✓</span>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section
        style={{
          borderTop: "1px solid #21262d",
          padding: "60px 40px",
          maxWidth: 1100,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "#484f58",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          Built with
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            "Next.js",
            "TypeScript",
            "BullMQ",
            "Upstash Redis",
            "Groq LLaMA 3.3",
            "Gemini 2.5 Flash",
            "GitHub Apps",
            "Vercel",
            "Render",
          ].map((t) => (
            <span
              key={t}
              style={{
                background: "#161b22",
                border: "1px solid #21262d",
                color: "#8b949e",
                padding: "6px 16px",
                borderRadius: 20,
                fontSize: 13,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          borderTop: "1px solid #21262d",
          padding: "80px 40px",
          textAlign: "center",
          background: "#010409",
        }}
      >
        <h2
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: "#f0f6fc",
            marginBottom: 16,
          }}
        >
          Ready to ship better code?
        </h2>
        <p style={{ color: "#8b949e", fontSize: 18, marginBottom: 36 }}>
          One click to install. Works on any public or private repo.
        </p>
        <a
          href="https://github.com/apps/aicodereview001"
          target="_blank"
          style={{
            background: "#238636",
            color: "#fff",
            padding: "16px 40px",
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 700,
            display: "inline-block",
          }}
        >
          Install aicodereview001 on GitHub →
        </a>
        <div style={{ marginTop: 16, color: "#484f58", fontSize: 13 }}>
          Free · No credit card · Works instantly
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #21262d",
          padding: "24px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ color: "#484f58", fontSize: 13 }}>
          Built by{" "}
          <a
            href="https://www.linkedin.com/in/piyush-yadav-9611832b4/"
            style={{ color: "#58a6ff" }}
          >
            Piyush Yadav
          </a>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <a
            href="https://github.com/PIYuusHYADAV/CodeReviewAI"
            style={{ color: "#484f58", fontSize: 13 }}
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/piyush-yadav-9611832b4/"
            style={{ color: "#484f58", fontSize: 13 }}
          >
            LinkedIn
          </a>
        </div>
      </footer>
    </div>
  );
}
