import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
  bigint,
  unique,
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
