DO $$ BEGIN
 CREATE TYPE "dataset" AS ENUM('Train', 'Validation', 'Test');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_task_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	"dataset" "dataset" NOT NULL,
	CONSTRAINT "project_task_selections_project_id_task_id_label_id_unique" UNIQUE("project_id","task_id","label_id")
);
--> statement-breakpoint
ALTER TABLE "temp_task_inferences" RENAME TO "temp_tasks";--> statement-breakpoint
ALTER TABLE "temp_tasks" DROP CONSTRAINT "temp_task_inferences_task_name_unique";--> statement-breakpoint
ALTER TABLE "temp_tasks" DROP CONSTRAINT "temp_task_inferences_model_id_trained_models_id_fk";
--> statement-breakpoint
ALTER TABLE "temp_tasks" DROP CONSTRAINT "temp_task_inferences_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "temp_tasks" ALTER COLUMN "model_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "temp_tasks" ALTER COLUMN "inference" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "temp_tasks" ADD COLUMN "dataset" "dataset";--> statement-breakpoint
ALTER TABLE "temp_tasks" ADD COLUMN "label_id" uuid;--> statement-breakpoint
ALTER TABLE "temp_tasks" ADD COLUMN "label_value" "task_label_value";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "temp_tasks" ADD CONSTRAINT "temp_tasks_model_id_trained_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "trained_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "temp_tasks" ADD CONSTRAINT "temp_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "temp_tasks" ADD CONSTRAINT "temp_tasks_label_id_project_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "project_labels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_task_selections" ADD CONSTRAINT "project_task_selections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_task_selections" ADD CONSTRAINT "project_task_selections_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_task_selections" ADD CONSTRAINT "project_task_selections_label_id_project_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "project_labels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "temp_tasks" ADD CONSTRAINT "temp_tasks_task_name_unique" UNIQUE("task_name");