ALTER TABLE "tasks" DROP CONSTRAINT "tasks_image_url_project_id_unique";--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_name_project_id_unique" UNIQUE("name","project_id");--> statement-breakpoint
ALTER TABLE "temp_task_inferences" ADD CONSTRAINT "temp_task_inferences_task_name_unique" UNIQUE("task_name");