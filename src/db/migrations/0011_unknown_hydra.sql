CREATE INDEX IF NOT EXISTS "tasks_project_id_index" ON "tasks" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_name_index" ON "tasks" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "temp_tasks_task_name_index" ON "temp_tasks" ("task_name");