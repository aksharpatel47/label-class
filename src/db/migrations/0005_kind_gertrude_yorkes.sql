CREATE TABLE IF NOT EXISTS "temp_task_inferences" (
	"task_name" varchar(255) NOT NULL,
	"model_id" integer NOT NULL,
	"inference" integer NOT NULL,
	"project_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "temp_task_inferences" ADD CONSTRAINT "temp_task_inferences_model_id_trained_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "trained_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "temp_task_inferences" ADD CONSTRAINT "temp_task_inferences_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
