import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db, announcementsTable } from "@workspace/db";

const router = Router();

router.get("/announcements", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(announcementsTable)
    .where(eq(announcementsTable.isPublished, true))
    .orderBy(desc(announcementsTable.isPinned), desc(announcementsTable.createdAt))
    .limit(20);
  res.json(rows);
});

export default router;
