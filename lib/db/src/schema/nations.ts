import { pgTable, text, serial, integer, real, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nationsTable = pgTable("nations", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  flagEmoji: text("flag_emoji").notNull(),
  confederation: text("confederation").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  confidenceScore: real("confidence_score"),
});

export const nationConfidenceVotesTable = pgTable(
  "nation_confidence_votes",
  {
    id: serial("id").primaryKey(),
    nationCode: text("nation_code").notNull(),
    userId: integer("user_id").notNull(),
    level: integer("level").notNull(), // 1–5
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [unique("nation_user_vote_unique").on(t.nationCode, t.userId)]
);

export const insertNationSchema = createInsertSchema(nationsTable);
export type InsertNation = z.infer<typeof insertNationSchema>;
export type Nation = typeof nationsTable.$inferSelect;
export type NationConfidenceVote = typeof nationConfidenceVotesTable.$inferSelect;
