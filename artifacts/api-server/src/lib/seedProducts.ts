import { db, productsTable } from "@workspace/db";
import { count } from "drizzle-orm";

const PRODUCTS = [
  { name: "Brazil Nation Frame", description: "Gold & green premium profile frame for Brazil fans", category: "nation_frame", price: 19900 },
  { name: "Argentina Nation Frame", description: "Sky blue & white profile frame for Argentina fans", category: "nation_frame", price: 19900 },
  { name: "England Nation Frame", description: "Classic Three Lions profile frame", category: "nation_frame", price: 19900 },
  { name: "Germany Nation Frame", description: "Black & white precision frame for Germany fans", category: "nation_frame", price: 19900 },
  { name: "France Nation Frame", description: "Tricolor elegant frame for Les Bleus fans", category: "nation_frame", price: 19900 },
  { name: "Spain Nation Frame", description: "La Roja passionate frame for Spain fans", category: "nation_frame", price: 19900 },
  { name: "Brazil Animated Flag", description: "Waving animated Brazilian flag badge", category: "animated_flag", price: 29900 },
  { name: "Argentina Animated Flag", description: "Waving animated Argentinian flag badge", category: "animated_flag", price: 29900 },
  { name: "World Cup 2026 Theme", description: "Official World Cup 2026 profile theme with golden accents", category: "worldcup_theme", price: 49900 },
  { name: "Champions Theme", description: "Golden champions aesthetic theme with trophy accents", category: "worldcup_theme", price: 39900 },
  { name: "Ultras Theme", description: "Dark, electric ultras-inspired profile theme", category: "special_theme", price: 34900 },
  { name: "Night Mode Elite", description: "Exclusive deep midnight profile aesthetic", category: "special_theme", price: 29900 },
];

export async function seedProducts() {
  const [{ total }] = await db.select({ total: count() }).from(productsTable);
  if (Number(total) > 0) return;
  await db.insert(productsTable).values(PRODUCTS);
  console.log(`[seed] Inserted ${PRODUCTS.length} cosmetic products`);
}
