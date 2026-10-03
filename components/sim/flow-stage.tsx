"use client";
import { motion, useReducedMotion } from "motion/react";
import type { Node, Scenario } from "./data";

const W = 900,
  H = 490,
  R = 50;

function DbArt({ on, delay }: { on: boolean; delay: number }) {
  const stroke = on ? "var(--color-brand)" : "var(--color-line)";
  return (
    <g>
      <path
        d="M-36 -24 v50 a36 13 0 0 0 72 0 v-50"
        fill="#12142a"
        stroke={stroke}
        strokeWidth="2"
      />
      {[0, 1, 2].map((i) => (
        <motion.rect
          key={i}
          x={-24}
          y={-8 + i * 13}
          width={48}
          height={6}
          rx={3}
          animate={{
            fill: on ? "var(--color-brand)" : "#242846",
            opacity: on ? 1 : 0.8,
          }}
          transition={{ delay: on ? delay + 0.5 + i * 0.15 : 0 }}
        />
      ))}
      <ellipse
        cx={0}
        cy={-24}
        rx={36}
        ry={13}
        fill="#1d2142"
        stroke={stroke}
        strokeWidth="2"
      />
      <motion.rect
        x={-14}
        y={-40}
        width={28}
        height={14}
        rx={4}
        fill="#fff"
        animate={on ? { y: [-90, -26], opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ delay, duration: 0.8, times: [0, 0.6, 1] }}
      />
    </g>
  );
}

function QueueArt({ on }: { on: boolean }) {
  return (
    <g>
      <rect
        x={-40}
        y={-18}
        width={80}
        height={36}
        rx={10}
        fill="#12142a"
        stroke={on ? "var(--color-brand)" : "var(--color-line)"}
        strokeWidth="2"
      />
      {[0, 1, 2].map((i) => (
        <motion.rect
          key={i}
          y={-9}
          width={16}
          height={18}
          rx={4}
          x={-30 + i * 22}
          animate={
            on
              ? {
                  x: [-30 + i * 22 - 14, -30 + i * 22],
                  fill: "var(--color-brand)",
                }
              : { fill: "#242846" }
          }
          transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
        />
      ))}
    </g>
  );
}

function IconArt({ node, on }: { node: Node; on: boolean }) {
  const Icon = node.icon;
  return (
    <g>
      <rect
        x={-38}
        y={-38}
        width={76}
        height={76}
        rx={20}
        fill="var(--color-card)"
        stroke={on ? "var(--color-brand)" : "var(--color-line)"}
        strokeWidth="2"
      />
      <g
        transform="translate(-15,-15)"
        style={{ color: on ? "var(--color-brand)" : "var(--color-muted)" }}
      >
        <Icon size={30} />
      </g>
    </g>
  );
}

export function FlowStage({ sc, step }: { sc: Scenario; step: number }) {
  const reduce = useReducedMotion();
  const cur = sc.steps[step];
  const by = Object.fromEntries(sc.nodes.map((n) => [n.id, n]));
  const edges = sc.links
    ? sc.links.map((l) => l.join(">"))
    : Array.from(
        new Set(sc.steps.flatMap((s) => (s.move ? [s.move.join(">")] : []))),
      );
  const mv = cur.move ? { a: by[cur.move[0]], b: by[cur.move[1]] } : null;
  const dur = reduce ? 0 : 0.9;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`${sc.name}: ${cur.title}`}
    >
      <defs>
        <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#ffffff14" />
        </pattern>
        <radialGradient id="halo">
          <stop offset="0%" stopColor="#8b7bff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8b7bff" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width={W} height={H} rx={24} fill="url(#dots)" />
      {sc.zones?.map((z) => {
        const on = z.ids.some((i) => cur.active.includes(i));
        return (
          <motion.g
            key={z.id}
            animate={{ opacity: step === 0 || on ? 1 : 0.5 }}
          >
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx={24}
              fill={on ? "#8b7bff14" : "#ffffff05"}
              stroke={on ? "var(--color-brand)" : "var(--color-line)"}
              strokeWidth={on ? 2 : 1.5}
              strokeDasharray={on ? undefined : "5 6"}
            />
            <text
              x={z.x + 18}
              y={z.y + 28}
              className={on ? "fill-brand" : "fill-muted"}
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              {z.label}
            </text>
            {z.sub && (
              <text
                x={z.x + 18}
                y={z.y + 46}
                className="fill-muted"
                style={{ fontSize: 11 }}
              >
                {z.sub}
              </text>
            )}
          </motion.g>
        );
      })}

      {edges.map((e) => {
        const [a, b] = e.split(">").map((id) => by[id]);
        const hl =
          !!sc.links &&
          step > 0 &&
          (cur.active.includes(a.id) || cur.active.includes(b.id));
        return (
          <line
            key={e}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={hl ? "var(--color-brand)" : "var(--color-line)"}
            strokeOpacity={hl ? 0.7 : 1}
            strokeWidth={2}
            strokeDasharray="6 6"
          />
        );
      })}
      {mv && (
        <>
          <line
            x1={mv.a.x}
            y1={mv.a.y}
            x2={mv.b.x}
            y2={mv.b.y}
            stroke="var(--color-brand)"
            strokeOpacity={0.5}
            strokeWidth={2}
            strokeDasharray="6 6"
            className="flow-dash"
          />
          <motion.line
            key={`d-${sc.id}-${step}`}
            x1={mv.a.x}
            y1={mv.a.y}
            x2={mv.b.x}
            y2={mv.b.y}
            stroke="var(--color-brand)"
            strokeWidth={3}
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: dur, ease: "easeInOut" }}
          />
        </>
      )}

      {sc.nodes.map((nd) => {
        const on = cur.active.includes(nd.id);
        const arrive = !!cur.move && cur.move[1] === nd.id;
        const delay = arrive ? dur * 0.85 : 0;
        return (
          <motion.g
            key={`${sc.id}-${nd.id}`}
            transform={`translate(${nd.x} ${nd.y})`}
            animate={{ opacity: step === 0 || on ? 1 : 0.45 }}
          >
            {on && (
              <motion.circle
                r={R + 26}
                fill="url(#halo)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.6] }}
                transition={{ delay, duration: 0.8 }}
              />
            )}
            <circle r={R} fill="var(--color-paper)" opacity={0.9} />
            {nd.kind === "db" ? (
              <DbArt on={on} delay={delay} />
            ) : nd.kind === "queue" ? (
              <QueueArt on={on} />
            ) : (
              <IconArt node={nd} on={on} />
            )}
            <text
              y={R + 14}
              textAnchor="middle"
              className="fill-ink"
              style={{
                paintOrder: "stroke",
                stroke: "#06070c",
                strokeWidth: 5,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {nd.label}
            </text>
            {nd.sub && (
              <text
                y={R + 32}
                textAnchor="middle"
                className="fill-muted"
                style={{
                  paintOrder: "stroke",
                  stroke: "#06070c",
                  strokeWidth: 5,
                  fontSize: 12,
                }}
              >
                {nd.sub}
              </text>
            )}
          </motion.g>
        );
      })}

      {mv && (
        <motion.g
          key={`p-${sc.id}-${step}`}
          initial={{ x: mv.a.x, y: mv.a.y }}
          animate={{ x: mv.b.x, y: mv.b.y }}
          transition={{ duration: dur, ease: "easeInOut" }}
        >
          <circle r={20} fill="url(#halo)" />
          <rect
            x={-9}
            y={-9}
            width={18}
            height={18}
            rx={5}
            fill="#fff"
            filter="url(#glow)"
          />
          {cur.packet && (
            <g transform="translate(0 -30)">
              <rect
                x={-4 - cur.packet.length * 3.6}
                y={-12}
                width={8 + cur.packet.length * 7.2}
                height={22}
                rx={11}
                fill="var(--color-brand)"
              />
              <text
                textAnchor="middle"
                y={3}
                fill="#000"
                style={{ fontSize: 11, fontWeight: 700 }}
              >
                {cur.packet}
              </text>
            </g>
          )}
        </motion.g>
      )}
    </svg>
  );
}
