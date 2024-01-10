DO $$ BEGIN
 CREATE TYPE "task_label_value" AS ENUM('Present', 'Absent', 'Difficult', 'Skip');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "task_labels" ALTER COLUMN "task_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task_labels" ALTER COLUMN "label_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task_labels" ALTER COLUMN "labeled_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task_labels" ADD COLUMN "label_value" "task_label_value" DEFAULT 'YES' NOT NULL;