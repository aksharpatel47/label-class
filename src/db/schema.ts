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
  unique,
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
  assignedTasks: many(tasks),
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
  tasks: many(tasks),
}));

export const labels = pgTable("labels", {
  name: varchar("name", { length: 255 }).primaryKey().notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const labelsRelations = relations(labels, ({ many }) => ({
  projectLabels: many(projectLabels),
  taskLabels: many(taskLabels),
}));

export const projectLabels = pgTable(
  "project_labels",
  {
    id: smallserial("id").primaryKey().notNull(),
    projectId: smallint("project_id")
      .notNull()
      .references(() => projects.id),
    labelName: varchar("label_name", { length: 255 })
      .notNull()
      .references(() => labels.name),
    sequence: smallint("sequence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    proj_label_unq: unique().on(t.projectId, t.labelName),
  })
);

export const projectLabelsRelations = relations(
  projectLabels,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectLabels.projectId],
      references: [projects.id],
    }),
    label: one(labels, {
      fields: [projectLabels.labelName],
      references: [labels.name],
    }),
  })
);

export const tasks = pgTable(
  "tasks",
  {
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
  },
  (t) => ({
    img_proj_unq: unique().on(t.imageUrl, t.projectId),
  })
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  taskLabels: many(taskLabels),
}));

export const taskLabels = pgTable(
  "task_labels",
  {
    id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
    taskId: bigint("task_id", { mode: "number" }).references(() => tasks.id),
    labelName: varchar("label_name", { length: 255 }).references(
      () => labels.name
    ),
    labeledBy: uuid("labeled_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => ({
    task_label_user_unq: unique().on(t.taskId, t.labelName, t.labeledBy),
  })
);

export const taskLabelsRelations = relations(taskLabels, ({ one, many }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labels, {
    fields: [taskLabels.labelName],
    references: [labels.name],
  }),
  labeledBy: one(users, {
    fields: [taskLabels.labeledBy],
    references: [users.id],
  }),
}));
