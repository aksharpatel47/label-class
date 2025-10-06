CREATE TABLE "task_assignments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"label_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "project_labels" DROP CONSTRAINT "project_labels_project_id_label_name_unique";--> statement-breakpoint
ALTER TABLE "task_inferences" DROP CONSTRAINT "task_inferences_image_name_model_id_unique";--> statement-breakpoint
ALTER TABLE "task_labels" DROP CONSTRAINT "task_labels_task_id_label_id_unique";--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_name_project_id_unique";--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_to_auth_user_id_fk";
--> statement-breakpoint
DROP INDEX "tasks_project_id_index";--> statement-breakpoint
DROP INDEX "tasks_name_index";--> statement-breakpoint
DROP INDEX "temp_tasks_task_name_index";--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_label_id_project_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."project_labels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_task_assignment" ON "task_assignments" USING btree ("task_id","user_id","label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proj_label_unq" ON "project_labels" USING btree ("project_id","label_name");--> statement-breakpoint
CREATE UNIQUE INDEX "task_model_unq" ON "task_inferences" USING btree ("image_name","model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_label_unq" ON "task_labels" USING btree ("task_id","label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "name_project_unq" ON "tasks" USING btree ("name","project_id");--> statement-breakpoint
CREATE INDEX "project_index" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "name_index" ON "tasks" USING btree ("name");--> statement-breakpoint
CREATE INDEX "task_name_index" ON "temp_tasks" USING btree ("task_name");--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "assigned_to";