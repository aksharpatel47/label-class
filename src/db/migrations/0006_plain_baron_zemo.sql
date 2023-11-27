ALTER TABLE "project_labels" DROP CONSTRAINT "project_labels_label_id_labels_id_fk";
--> statement-breakpoint
ALTER TABLE "task_labels" DROP CONSTRAINT "task_labels_label_id_labels_id_fk";
--> statement-breakpoint
ALTER TABLE "labels" DROP CONSTRAINT "labels_pkey";--> statement-breakpoint
ALTER TABLE "labels" ADD PRIMARY KEY ("name");--> statement-breakpoint
ALTER TABLE "project_labels" ADD COLUMN "label_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "task_labels" ADD COLUMN "label_name" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_labels" ADD CONSTRAINT "project_labels_label_name_labels_name_fk" FOREIGN KEY ("label_name") REFERENCES "labels"("name") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_label_name_labels_name_fk" FOREIGN KEY ("label_name") REFERENCES "labels"("name") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "labels" DROP COLUMN IF EXISTS "id";--> statement-breakpoint
ALTER TABLE "project_labels" DROP COLUMN IF EXISTS "label_id";--> statement-breakpoint
ALTER TABLE "task_labels" DROP COLUMN IF EXISTS "label_id";