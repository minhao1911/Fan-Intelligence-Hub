import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Founder Passes ────────────────────────────────────────────────────────────
export const founderPassesTable = pgTable("founder_passes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  founderNumber: integer("founder_number").notNull().unique(),
  paymentId: text("payment_id").notNull(),
  orderId: text("order_id").notNull(),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFounderPassSchema = createInsertSchema(founderPassesTable).omit({ id: true, purchasedAt: true });
export type InsertFounderPass = z.infer<typeof insertFounderPassSchema>;
export type FounderPass = typeof founderPassesTable.$inferSelect;

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  plan: text("plan").notNull().default("premium"), // "premium"
  status: text("status").notNull().default("active"), // "active" | "cancelled" | "expired"
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;

// ── Products (cosmetics marketplace) ─────────────────────────────────────────
export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "nation_frame" | "animated_flag" | "special_theme" | "worldcup_theme"
  price: integer("price").notNull(), // in paise (INR * 100)
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

// ── Purchases (one-time cosmetic purchases) ───────────────────────────────────
export const purchasesTable = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  paymentId: text("payment_id").notNull(),
  orderId: text("order_id").notNull(),
  amountPaid: integer("amount_paid").notNull(), // in paise
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPurchaseSchema = createInsertSchema(purchasesTable).omit({ id: true, purchasedAt: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchasesTable.$inferSelect;

// ── User Cosmetics (equip/unequip) ────────────────────────────────────────────
export const userCosmeticsTable = pgTable("user_cosmetics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  isEquipped: boolean("is_equipped").notNull().default(false),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserCosmeticSchema = createInsertSchema(userCosmeticsTable).omit({ id: true, acquiredAt: true });
export type InsertUserCosmetic = z.infer<typeof insertUserCosmeticSchema>;
export type UserCosmetic = typeof userCosmeticsTable.$inferSelect;

// ── Razorpay Orders (pending order tracking) ──────────────────────────────────
export const razorpayOrdersTable = pgTable("razorpay_orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "founder_pass" | "subscription" | "cosmetic"
  productId: integer("product_id"), // for cosmetics
  amount: integer("amount").notNull(), // in paise
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("created"), // "created" | "paid" | "failed"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRazorpayOrderSchema = createInsertSchema(razorpayOrdersTable).omit({ id: true, createdAt: true });
export type InsertRazorpayOrder = z.infer<typeof insertRazorpayOrderSchema>;
export type RazorpayOrder = typeof razorpayOrdersTable.$inferSelect;
