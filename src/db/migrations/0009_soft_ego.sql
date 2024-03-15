ALTER TABLE "project_task_selections" DROP CONSTRAINT "project_task_selections_project_id_task_id_label_id_unique";--> statement-breakpoint
ALTER TABLE "project_task_selections" DROP CONSTRAINT "project_task_selections_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "project_task_selections" DROP COLUMN IF EXISTS "project_id";--> statement-breakpoint
ALTER TABLE "project_task_selections" ADD CONSTRAINT "project_task_selections_task_id_label_id_unique" UNIQUE("task_id","label_id");