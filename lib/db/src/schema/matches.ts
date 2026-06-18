import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  homeNationCode: text("home_nation_code").notNull(),
  awayNationCode: text("away_nation_code").notNull(),
  competition: text("competition").notNull(),
  stage: text("stage"),
  status: text("status").notNull().default("upcoming"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;

export const pollsTable = pgTable("polls", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  question: text("question").notNull(),
  pollType: text("poll_type").notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pollOptionsTable = pgTable("poll_options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  value: text("value").notNull(),
  label: text("label").notNull(),
  voteCount: integer("vote_count").notNull().default(0),
});

export const pollVotesTable = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  userId: integer("user_id").notNull(),
  optionValue: text("option_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reactionsTable = pgTable("reactions", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  userId: integer("user_id").notNull(),
  reactionType: text("reaction_type").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
