import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Subjects Table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubjectSchema = createInsertSchema(subjects, {
  name: (schema) => schema.min(2, "Subject name must be at least 2 characters"),
});
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

// Topics Table (study topics within subjects)
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: text("completed_at"), // Using text instead of timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTopicSchema = createInsertSchema(topics, {
  name: (schema) => schema.min(2, "Topic name must be at least 2 characters"),
});
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

// Study Sessions Table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  topic: text("topic").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // Using text instead of timestamp
  endTime: text("end_time").notNull(), // Using text instead of timestamp
  durationHours: integer("duration_hours").notNull(),
  notes: text("notes"),
  completedAt: text("completed_at"), // Using text instead of timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions, {
  topic: (schema) => schema.min(2, "Session topic must be at least 2 characters"),
  date: (schema) => schema.min(10, "Date must be in YYYY-MM-DD format"),
});
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Session Topics (tracks topics covered in a session)
export const sessionTopics = pgTable("session_topics", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  topicId: integer("topic_id").references(() => topics.id).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: text("completed_at"), // Using text instead of timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionTopicSchema = createInsertSchema(sessionTopics);
export type InsertSessionTopic = z.infer<typeof insertSessionTopicSchema>;
export type SessionTopic = typeof sessionTopics.$inferSelect;

// Exams Table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(), // Using text instead of timestamp to avoid conversion issues
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExamSchema = createInsertSchema(exams, {
  title: (schema) => schema.min(2, "Exam title must be at least 2 characters"),
});
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

// Topics for Exams (tracks which topics are part of each exam)
export const examTopics = pgTable("exam_topics", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  topicId: integer("topic_id").references(() => topics.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExamTopicSchema = createInsertSchema(examTopics);
export type InsertExamTopic = z.infer<typeof insertExamTopicSchema>;
export type ExamTopic = typeof examTopics.$inferSelect;

// Users Table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Study Stats Table (for tracking overall study metrics)
export const studyStats = pgTable("study_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  totalStudyTime: integer("total_study_time").default(0).notNull(), // in minutes
  topicsCompleted: integer("topics_completed").default(0).notNull(),
  sessionsCompleted: integer("sessions_completed").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Define Relations
export const subjectsRelations = relations(subjects, ({ many, one }) => ({
  topics: many(topics),
  sessions: many(sessions),
  exams: many(exams),
  user: one(users, { fields: [subjects.userId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  subjects: many(subjects),
  sessions: many(sessions),
  exams: many(exams),
  studyStats: many(studyStats),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, { fields: [topics.subjectId], references: [subjects.id] }),
  sessionTopics: many(sessionTopics),
  examTopics: many(examTopics),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  subject: one(subjects, { fields: [sessions.subjectId], references: [subjects.id] }),
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
  sessionTopics: many(sessionTopics),
}));

export const sessionTopicsRelations = relations(sessionTopics, ({ one }) => ({
  session: one(sessions, { fields: [sessionTopics.sessionId], references: [sessions.id] }),
  topic: one(topics, { fields: [sessionTopics.topicId], references: [topics.id] }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  subject: one(subjects, { fields: [exams.subjectId], references: [subjects.id] }),
  user: one(users, { fields: [exams.userId], references: [users.id] }),
  examTopics: many(examTopics),
}));

export const examTopicsRelations = relations(examTopics, ({ one }) => ({
  exam: one(exams, { fields: [examTopics.examId], references: [exams.id] }),
  topic: one(topics, { fields: [examTopics.topicId], references: [topics.id] }),
}));

export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email("Please enter a valid email"),
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
