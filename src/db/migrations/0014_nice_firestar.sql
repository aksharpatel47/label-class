ALTER TABLE "tasks" ALTER COLUMN "project_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sequence" smallint DEFAULT 0 NOT NULL;