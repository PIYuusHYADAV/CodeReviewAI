import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
  bigint,
  unique,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
export const userCredentials = pgTable(
  "userCredentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userinfo: text("userinfo").notNull(),
    treesha: text("treesha").notNull(),
    prNumber: bigint("prnumber", { mode: "number" }).notNull(),
    commitsha: text("commitsha").notNull(),
    basesha: text("basesha").notNull(),
    title: text("title").notNull(),
    installationId: text("installationId").notNull(),

    checkRunId: bigint("checkRunId", { mode: "number" }).notNull(),
    status: text("status", {
      enum: ["pending", "completed", "failed", "processing"],
    })
      .notNull()
      .default("pending"),
    attempts: integer("attempts").notNull().default(0),
    data: jsonb("data"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueRepoTreesha: unique("unique_repo_treesha").on(
      table.userinfo,
      table.treesha,
    ),
  }),
);
export const reviewWaiters = pgTable(
  "reviewWaiters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userinfo: text("userinfo").notNull(),
    treesha: text("treesha").notNull(),
    prNumber: bigint("prNumber", { mode: "number" }).notNull(),
    commitsha: text("commitsha").notNull(),
    checkRunId: bigint("checkRunId", { mode: "number" }).notNull(),
    commentId: bigint("commentId", { mode: "number" }),
    status: text("status", { enum: ["pending", "delivered", "failed"] })
      .notNull()
      .default("pending"),
    error: text("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at"),
  },
  (t) => ({
    uniqueWaiter: unique("unique_waiter").on(
      t.userinfo,
      t.treesha,
      t.checkRunId,
    ),
    lookupIdx: index("waiters_lookup_idx").on(t.userinfo, t.treesha, t.status),
    reviewFk: foreignKey({
      name: "waiters_review_fk",
      columns: [t.userinfo, t.treesha],
      foreignColumns: [userCredentials.userinfo, userCredentials.treesha],
    }).onDelete("cascade"),
  }),
);
