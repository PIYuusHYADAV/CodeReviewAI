CREATE TABLE "reviewWaiters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userinfo" text NOT NULL,
	"treesha" text NOT NULL,
	"prNumber" bigint NOT NULL,
	"commitsha" text NOT NULL,
	"checkRunId" bigint NOT NULL,
	"commentId" bigint,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"delievered_at" timestamp,
	CONSTRAINT "unique_waiter" UNIQUE("userinfo","treesha","checkRunId")
);
--> statement-breakpoint
ALTER TABLE "reviewWaiters" ADD CONSTRAINT "waiters_review_fk" FOREIGN KEY ("userinfo","treesha") REFERENCES "public"."userCredentials"("userinfo","treesha") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "waiters_lookup_idx" ON "reviewWaiters" USING btree ("userinfo","treesha","status");--> statement-breakpoint
ALTER TABLE "userCredentials" ADD CONSTRAINT "unique_repo_treesha" UNIQUE("userinfo","treesha");