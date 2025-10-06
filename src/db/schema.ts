import { relations, sql } from "drizzle-orm";
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
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const authUserRoleEnum = pgEnum("auth_user_role", ["ADMIN", "USER"]);
export type AuthUserRole = (typeof authUserRoleEnum.enumValues)[number];
export const datasetEnumValues = ["train", "valid", "test"] as const;
export const datasetEnum = pgEnum("dataset", datasetEnumValues);
export type Dataset = (typeof datasetEnum.enumValues)[number];

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

export type UserKey = typeof userKey.$inferSelect;

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

export type UserSession = typeof userSession.$inferSelect;

export const usersRelations = relations(authUser, ({ many }) => ({
  projects: many(projects),
  assignedTasks: many(tasks),
  sessions: many(userSession),
}));

export const sessionsRelations = relations(userSession, ({ one }) => ({
  user: one(authUser, {
    fields: [userSession.userId],
    references: [authUser.id],
  }),
}));

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  sequence: smallint("sequence").notNull().default(0),
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
  (table) => [
    uniqueIndex("proj_label_unq").on(table.projectId, table.labelName),
  ]
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
    assignedOn: timestamp("assigned_on", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("name_project_unq").on(table.name, table.projectId),
    index("project_index").on(table.projectId),
    index("name_index").on(table.name),
  ]
);

export type Task = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  taskLabels: many(taskLabels),
}));

export const taskAssignments = pgTable(
  "task_assignments",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .default(sql`uuidv7()`),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id),
    labelId: uuid("label_id")
      .notNull()
      .references(() => projectLabels.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("unique_task_assignment").on(
      table.taskId,
      table.userId,
      table.labelId
    ),
  ]
);

export type TaskAssignment = typeof taskAssignments.$inferSelect;

export const taskAssignmentsRelations = relations(
  taskAssignments,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskAssignments.taskId],
      references: [tasks.id],
    }),
    user: one(authUser, {
      fields: [taskAssignments.userId],
      references: [authUser.id],
    }),
    label: one(projectLabels, {
      fields: [taskAssignments.labelId],
      references: [projectLabels.id],
    }),
  })
);

export const taskLabelEnumValues = [
  "Present",
  "Absent",
  "Difficult",
  "Skip",
] as const;
export const taskLabelValue = pgEnum("task_label_value", taskLabelEnumValues);
export type TaskLabelValue = (typeof taskLabelValue.enumValues)[number];

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
    flag: boolean("flag").notNull().default(false),
    labeledBy: text("labeled_by")
      .references(() => authUser.id)
      .notNull(),
    labelUpdatedBy: text("label_updated_by").references(() => authUser.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("task_label_unq").on(table.taskId, table.labelId)]
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
  link: varchar("link", { length: 1024 }),
  labelName: varchar("label_name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
  (table) => [uniqueIndex("task_model_unq").on(table.imageName, table.modelId)]
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
  (table) => [index("task_name_index").on(table.taskName)]
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

export const userSessionRelations = relations(userSession, ({ one }) => ({
  user: one(authUser, {
    fields: [userSession.userId],
    references: [authUser.id],
  }),
}));
