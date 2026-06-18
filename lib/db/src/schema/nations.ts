import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
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

export const insertNationSchema = createInsertSchema(nationsTable);
export type InsertNation = z.infer<typeof insertNationSchema>;
export type Nation = typeof nationsTable.$inferSelect;
