ALTER TABLE "trained_models" ADD COLUMN "link" varchar(1024);--> statement-breakpoint
ALTER TABLE "trained_models" ADD COLUMN "label_name" varchar(255);--> statement-breakpoint
ALTER TABLE "trained_models" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;