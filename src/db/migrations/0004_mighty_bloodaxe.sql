ALTER TABLE "task_labels" DROP CONSTRAINT "task_labels_task_id_label_id_labeled_by_unique";--> statement-breakpoint
ALTER TABLE "task_labels" ADD COLUMN "label_updated_by" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_label_updated_by_auth_user_id_fk" FOREIGN KEY ("label_updated_by") REFERENCES "auth_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_task_id_label_id_unique" UNIQUE("task_id","label_id");