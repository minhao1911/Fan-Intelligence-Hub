import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const REPUTATION_TIERS = [
  { name: "Casual", minPoints: 0 },
  { name: "Fan", minPoints: 50 },
  { name: "Capo", minPoints: 200 },
  { name: "Ultras", minPoints: 500 },
];

export function getReputationTier(points: number): string {
  for (let i = REPUTATION_TIERS.length - 1; i >= 0; i--) {
    if (points >= REPUTATION_TIERS[i].minPoints) {
      return REPUTATION_TIERS[i].name;
    }
  }
  return "Casual";
}

export async function getOrCreateUser(clerkId: string, username?: string, avatarUrl?: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing[0]) return existing[0];

  const [newUser] = await db.insert(usersTable).values({
    clerkId,
    username: username || `fan_${clerkId.slice(-6)}`,
    avatarUrl: avatarUrl || null,
  }).returning();
  return newUser;
}
