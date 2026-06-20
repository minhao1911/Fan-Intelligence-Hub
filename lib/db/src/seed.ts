import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { nationsTable, matchesTable } from "./schema";
import { nations, generateMatchRows } from "./seedData";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("Seeding nations...");
  await db
    .insert(nationsTable)
    .values(nations)
    .onConflictDoNothing();
  console.log(`  ✓ ${nations.length} nations inserted`);

  console.log("Seeding group stage matches...");
  const matchRows = generateMatchRows();
  await db
    .insert(matchesTable)
    .values(matchRows)
    .onConflictDoNothing();
  console.log(`  ✓ ${matchRows.length} group stage matches inserted`);

  await pool.end();
  console.log("Done!");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
