import { time } from "console";
import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  integer,
  pgTable,
  serial,
  smallint,
  smallserial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projects = pgTable("projects", {
  id: smallserial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  projectLabels: many(projectLabels),
}));

export const labels = pgTable("labels", {
  id: smallserial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const labelsRelations = relations(labels, ({ many }) => ({
  projectLabels: many(projectLabels),
}));

export const projectLabels = pgTable("project_labels", {
  id: smallserial("id").primaryKey().notNull(),
  projectId: smallint("project_id")
    .notNull()
    .references(() => projects.id),
  labelId: smallint("label_id")
    .notNull()
    .references(() => labels.id),
  sequence: smallint("sequence").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const projectLabelsRelations = relations(
  projectLabels,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectLabels.projectId],
      references: [projects.id],
    }),
    label: one(labels, {
      fields: [projectLabels.labelId],
      references: [labels.id],
    }),
  })
);

export const tasks = pgTable("tasks", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: varchar("image_url", { length: 1024 }).notNull(),
  projectId: smallint("project_id").references(() => projects.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  assignedTo: uuid("assigned_to").references(() => users.id),
  assignedOn: timestamp("assigned_on", { withTimezone: true }),
});

export const taskLabels = pgTable("task_labels", {
  id: smallserial("id").primaryKey().notNull(),
  taskId: bigint("task_id", { mode: "number" }).references(() => tasks.id),
  labelId: smallint("label_id").references(() => labels.id),
  labeledBy: uuid("labeled_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
