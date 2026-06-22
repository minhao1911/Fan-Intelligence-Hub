import type { Request, Response, NextFunction } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, founderPassesTable, subscriptionsTable } from "@workspace/db";
import { getOrCreateUser } from "../lib/userHelpers";

export async function requirePremium(req: Request, res: Response, next: NextFunction): Promise<void> {
  const replitUserId: string | undefined = (req as any).replitUserId;
  if (!replitUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(replitUserId);

  const [founderPass] = await db
    .select()
    .from(founderPassesTable)
    .where(eq(founderPassesTable.userId, user.id));

  if (founderPass) {
    next();
    return;
  }

  const now = new Date();
  const [activeSub] = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, user.id),
        eq(subscriptionsTable.status, "active"),
        sql`${subscriptionsTable.expiryDate} > ${now}`,
      ),
    );

  if (activeSub) {
    next();
    return;
  }

  res.status(402).json({
    error: "premium_required",
    message: "Advanced Nation Pulse analytics require a Premium subscription or Founder Pass.",
  });
}
