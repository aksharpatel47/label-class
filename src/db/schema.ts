import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

export const authUserRoleEnum = pgEnum("auth_user_role", ["ADMIN", "USER"]);
export type AuthUserRole = typeof authUserRoleEnum.enumValues;
export const datasetEnumValues = ["train", "valid", "test"] as const;
export const datasetEnum = pgEnum("dataset", datasetEnumValues);
export type Dataset = typeof datasetEnum.enumValues;

export const authUser = pgTable("auth_user", {
  id: text("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: authUserRoleEnum("role").notNull().default("USER"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type AuthUser = typeof authUser.$inferSelect;

export const userKey = pgTable("user_key", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => authUser.id),
  hashedPassword: text("hashed_password"),
});

export const userSession = pgTable("user_session", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => authUser.id),
  activeExpires: bigint("active_expires", {
    mode: "number",
  }).notNull(),
  idleExpires: bigint("idle_expires", {
    mode: "number",
  }).notNull(),
});

export const usersRelations = relations(authUser, ({ many }) => ({
  projects: many(projects),
  assignedTasks: many(tasks),
}));

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdBy: text("created_by")
    .notNull()
    .references(() => authUser.id),
});

export type Project = typeof projects.$inferSelect;

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(authUser, {
    fields: [projects.createdBy],
    references: [authUser.id],
  }),
  projectLabels: many(projectLabels),
  tasks: many(tasks),
}));

export const projectLabels = pgTable(
  "project_labels",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    labelName: varchar("label_name", { length: 255 }).notNull(),
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

export type ProjectLabel = typeof projectLabels.$inferSelect;

export const projectLabelsRelations = relations(projectLabels, ({ one }) => ({
  project: one(projects, {
    fields: [projectLabels.projectId],
    references: [projects.id],
  }),
}));

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    imageUrl: varchar("image_url", { length: 1024 }).notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    assignedTo: text("assigned_to").references(() => authUser.id),
    assignedOn: timestamp("assigned_on", { withTimezone: true }),
  },
  (t) => ({
    name_project_unq: unique().on(t.name, t.projectId),
    project_index: index().on(t.projectId),
    name_index: index().on(t.name),
  })
);

export type Task = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(authUser, {
    fields: [tasks.assignedTo],
    references: [authUser.id],
  }),
  taskLabels: many(taskLabels),
}));

export const taskLabelValue = pgEnum("task_label_value", [
  "Present",
  "Absent",
  "Difficult",
  "Skip",
]);
export type TaskLabelValue = typeof taskLabelValue.enumValues;

export const taskLabels = pgTable(
  "task_labels",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    taskId: uuid("task_id")
      .references(() => tasks.id)
      .notNull(),
    labelId: uuid("label_id")
      .references(() => projectLabels.id)
      .notNull(),
    value: taskLabelValue("label_value").notNull().default("Present"),
    labeledBy: text("labeled_by")
      .references(() => authUser.id)
      .notNull(),
    labelUpdatedBy: text("label_updated_by").references(() => authUser.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => ({
    task_label_unq: unique().on(t.taskId, t.labelId),
  })
);

export type TaskLabel = typeof taskLabels.$inferSelect;

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(projectLabels, {
    fields: [taskLabels.labelId],
    references: [projectLabels.id],
  }),
  labeledBy: one(authUser, {
    fields: [taskLabels.labeledBy],
    references: [authUser.id],
  }),
  labelUpdatedBy: one(authUser, {
    fields: [taskLabels.labelUpdatedBy],
    references: [authUser.id],
  }),
}));

export const trainedModels = pgTable("trained_models", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  archived: boolean("archived").notNull().default(false),
});

export type TrainedModel = typeof trainedModels.$inferSelect;

export const taskInferences = pgTable(
  "task_inferences",
  {
    id: serial("id").primaryKey().notNull(),
    imageName: varchar("image_name", { length: 255 }).notNull(),
    modelId: serial("model_id")
      .notNull()
      .references(() => trainedModels.id),
    inference: integer("inference").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    task_model_unq: unique().on(t.imageName, t.modelId),
  })
);

export type TaskInferences = typeof taskInferences.$inferSelect;

export const taskInferencesRelations = relations(taskInferences, ({ one }) => ({
  model: one(trainedModels, {
    fields: [taskInferences.modelId],
    references: [trainedModels.id],
  }),
}));

export const tempTasks = pgTable(
  "temp_tasks",
  {
    taskName: varchar("task_name", { length: 255 }).notNull().unique(),
    modelId: integer("model_id").references(() => trainedModels.id),
    inference: integer("inference"),
    projectId: uuid("project_id").references(() => projects.id),
    dataset: datasetEnum("dataset"),
    labelId: uuid("label_id").references(() => projectLabels.id),
    labelValue: taskLabelValue("label_value"),
  },
  (t) => ({
    task_name_index: index().on(t.taskName),
  })
);

export type TempTask = typeof tempTasks.$inferSelect;
export type TempTaskInsert = typeof tempTasks.$inferInsert;

export const projectTaskSelections = pgTable(
  "project_task_selections",
  {
    id: serial("id").primaryKey().notNull(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    labelId: uuid("label_id")
      .notNull()
      .references(() => projectLabels.id),
    dataset: datasetEnum("dataset").notNull(),
  },
  (t) => ({
    task_label_unq: unique().on(t.taskId, t.labelId),
  })
);

export type ProjectTaskSelectionInsert =
  typeof projectTaskSelections.$inferInsert;
export type ProjectTaskSelections = typeof projectTaskSelections.$inferSelect;

export const projectTaskSelectionsRelations = relations(
  projectTaskSelections,
  ({ one }) => ({
    task: one(tasks, {
      fields: [projectTaskSelections.taskId],
      references: [tasks.id],
    }),
    label: one(projectLabels, {
      fields: [projectTaskSelections.labelId],
      references: [projectLabels.id],
    }),
  })
);
