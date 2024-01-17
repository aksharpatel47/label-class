CREATE TABLE IF NOT EXISTS "task_inferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" uuid NOT NULL,
	"model_id" serial NOT NULL,
	"inference" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trained_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_labels" ALTER COLUMN "label_value" SET DEFAULT 'Present';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_inferences" ADD CONSTRAINT "task_inferences_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_inferences" ADD CONSTRAINT "task_inferences_model_id_trained_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "trained_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
