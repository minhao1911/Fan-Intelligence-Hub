import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const discussionsTable = pgTable("discussions", {
  id: serial("id").primaryKey(),
  nationCode: text("nation_code"),
  matchId: integer("match_id"),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  upvotes: integer("upvotes").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDiscussionSchema = createInsertSchema(discussionsTable).omit({ id: true, upvotes: true, commentCount: true, createdAt: true, updatedAt: true });
export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type Discussion = typeof discussionsTable.$inferSelect;

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const discussionUpvotesTable = pgTable("discussion_upvotes", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  discussionId: integer("discussion_id"),
  actorUsername: text("actor_username"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
