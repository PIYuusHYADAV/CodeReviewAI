CREATE TABLE "userCredentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userinfo" text NOT NULL,
	"treesha" text NOT NULL,
	"prnumber" bigint NOT NULL,
	"commitsha" text NOT NULL,
	"basesha" text NOT NULL,
	"title" text NOT NULL,
	"installationId" text NOT NULL,
	"checkRunId" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
