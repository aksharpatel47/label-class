TRUNCATE task_inferences;
ALTER TABLE "task_inferences" DROP CONSTRAINT "task_inferences_task_id_model_id_unique";--> statement-breakpoint
ALTER TABLE "task_inferences" DROP CONSTRAINT "task_inferences_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "task_inferences" ADD COLUMN "image_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "task_inferences" DROP COLUMN IF EXISTS "task_id";--> statement-breakpoint
ALTER TABLE "task_inferences" ADD CONSTRAINT "task_inferences_image_name_model_id_unique" UNIQUE("image_name","model_id");