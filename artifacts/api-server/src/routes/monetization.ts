import { Router } from "express";
import { eq, sql, and, count, sum, desc } from "drizzle-orm";
import {
  db,
  usersTable,
  founderPassesTable,
  subscriptionsTable,
  productsTable,
  purchasesTable,
  userCosmeticsTable,
  razorpayOrdersTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateUser } from "../lib/userHelpers";
import { razorpay, verifyPaymentSignature, verifyWebhookSignature } from "../lib/razorpay";

const router = Router();

const FOUNDER_PASS_PRICE = 99900; // ₹999 in paise
const PREMIUM_PRICE = 9900;       // ₹99 in paise
const FOUNDER_PASS_LIMIT = 1000;

// ── GET current user's entitlements ──────────────────────────────────────────
router.get("/monetization/me", requireAuth, async (req, res): Promise<void> => {
  const user = await getOrCreateUser((req as any).replitUserId);

  const [founderPass] = await db
    .select()
    .from(founderPassesTable)
    .where(eq(founderPassesTable.userId, user.id));

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
    )
    .limit(1);

  const cosmetics = await db
    .select({ productId: userCosmeticsTable.productId, isEquipped: userCosmeticsTable.isEquipped })
    .from(userCosmeticsTable)
    .where(eq(userCosmeticsTable.userId, user.id));

  res.json({
    isPremium: !!activeSub,
    isFounder: !!founderPass,
    founderNumber: founderPass?.founderNumber ?? null,
    subscription: activeSub ?? null,
    ownedProductIds: cosmetics.map((c) => c.productId),
    equippedProductIds: cosmetics.filter((c) => c.isEquipped).map((c) => c.productId),
  });
});

// ── Founder Pass: create order ────────────────────────────────────────────────
router.post("/monetization/founder-pass/order", requireAuth, async (req, res): Promise<void> => {
  const user = await getOrCreateUser((req as any).replitUserId);

  const [existing] = await db
    .select()
    .from(founderPassesTable)
    .where(eq(founderPassesTable.userId, user.id));
  if (existing) {
    res.status(409).json({ error: "You already own a Founder Pass" });
    return;
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(founderPassesTable);
  if (Number(total) >= FOUNDER_PASS_LIMIT) {
    res.status(410).json({ error: "All Founder Passes have been claimed" });
    return;
  }

  const order = await razorpay.orders.create({
    amount: FOUNDER_PASS_PRICE,
    currency: "INR",
    receipt: `fp_${user.id}_${Date.now()}`,
    notes: { type: "founder_pass", userId: String(user.id) },
  });

  await db.insert(razorpayOrdersTable).values({
    orderId: order.id,
    userId: user.id,
    type: "founder_pass",
    amount: FOUNDER_PASS_PRICE,
    currency: "INR",
    status: "created",
  });

  res.json({ orderId: order.id, amount: FOUNDER_PASS_PRICE, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID });
});

// ── Founder Pass: verify payment ──────────────────────────────────────────────
router.post("/monetization/founder-pass/verify", requireAuth, async (req, res): Promise<void> => {
  const user = await getOrCreateUser((req as any).replitUserId);
  const { orderId, paymentId, signature } = req.body;

  if (!orderId || !paymentId || !signature) {
    res.status(400).json({ error: "orderId, paymentId, and signature are required" });
    return;
  }

  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  const [existing] = await db
    .select()
    .from(founderPassesTable)
    .where(eq(founderPassesTable.userId, user.id));
  if (existing) {
    res.status(409).json({ error: "Founder Pass already granted" });
    return;
  }

  const [{ total }] = await db.select({ total: count() }).from(founderPassesTable);
  const founderNumber = Number(total) + 1;

  const [pass] = await db
    .insert(founderPassesTable)
    .values({ userId: user.id, founderNumber, paymentId, orderId })
    .returning();

  await db
    .update(razorpayOrdersTable)
    .set({ status: "paid" })
    .where(eq(razorpayOrdersTable.orderId, orderId));

  res.json({ success: true, founderNumber: pass.founderNumber });
});

// ── Premium Subscription: create order ───────────────────────────────────────
router.post("/monetization/subscription/order", requireAuth, async (req, res): Promise<void> => {
  const user = await getOrCreateUser((req as any).replitUserId);
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
    )
    .limit(1);

  if (activeSub) {
    res.status(409).json({ error: "You already have an active Premium subscription" });
    return;
  }

  const order = await razorpay.orders.create({
    amount: PREMIUM_PRICE,
    currency: "INR",
    receipt: `sub_${user.id}_${Date.now()}`,
    notes: { type: "subscription", userId: String(user.id) },
  });

  await db.insert(razorpayOrdersTable).values({
    orderId: order.id,
    userId: user.id,
    type: "subscription",
    amount: PREMIUM_PRICE,
    currency: "INR",
    status: "created",
  });

  res.json({ orderId: order.id, amount: PREMIUM_PRICE, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID });
});

// ── Premium Subscription: verify payment ─────────────────────────────────────
router.post("/monetization/subscription/verify", requireAuth, async (req, res): Promise<void> => {
  const user = await getOrCreateUser((req as any).replitUserId);
  const { orderId, paymentId, signature } = req.body;

  if (!orderId || !paymentId || !signature) {
    res.status(400).json({ error: "orderId, paymentId, and signature are required" });
    return;
  }

  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  const startDate = new Date();
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + 1);

  const [sub] = await db
    .insert(subscriptionsTable)
    .values({
      userId: user.id,
      plan: "premium",
      status: "active",
      razorpayPaymentId: paymentId,
      startDate,
      expiryDate,
    })
    .returning();

  await db
    .update(razorpayOrdersTable)
    .set({ status: "paid" })
    .where(eq(razorpayOrdersTable.orderId, orderId));

  res.json({ success: true, expiryDate: sub.expiryDate });
});

// ── Premium Subscription: cancel ─────────────────────────────────────────────
router.post("/monetization/subscription/cancel", requireAuth, async (req, res): Promise<void> => {
  const user = await getOrCreateUser((req as any).replitUserId);
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
    )
    .limit(1);

  if (!activeSub) {
    res.status(404).json({ error: "No active subscription found" });
    return;
  }

  await db
    .update(subscriptionsTable)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(subscriptionsTable.id, activeSub.id));

  res.json({ success: true, message: "Subscription cancelled. Access continues until expiry." });
});

// ── Products: list marketplace ────────────────────────────────────────────────
router.get("/monetization/products", requireAuth, async (req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.isActive, true))
    .orderBy(productsTable.category, productsTable.name);

  res.json(products);
});

// ── Cosmetic: create order ────────────────────────────────────────────────────
router.post("/monetization/cosmetic/order", requireAuth, async (req, res): Promise<void> => {
  const user = await getOrCreateUser((req as any).replitUserId);
  const { productId } = req.body;

  if (!productId) {
    res.status(400).json({ error: "productId is required" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.isActive, true)));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [alreadyOwned] = await db
    .select()
    .from(userCosmeticsTable)
    .where(and(eq(userCosmeticsTable.userId, user.id), eq(userCosmeticsTable.productId, productId)));

  if (alreadyOwned) {
    res.status(409).json({ error: "You already own this item" });
    return;
  }

  const order = await razorpay.orders.create({
    amount: product.price,
    currency: "INR",
    receipt: `cos_${user.id}_${productId}_${Date.now()}`,
    notes: { type: "cosmetic", userId: String(user.id), productId: String(productId) },
  });

  await db.insert(razorpayOrdersTable).values({
    orderId: order.id,
    userId: user.id,
    type: "cosmetic",
    productId,
    amount: product.price,
    currency: "INR",
    status: "created",
  });

  res.json({ orderId: order.id, amount: product.price, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID });
});

// ── Cosmetic: verify payment ──────────────────────────────────────────────────
router.post("/monetization/cosmetic/verify", requireAuth, async (req, res): Promise<void> => {
  const user = await getOrCreateUser((req as any).replitUserId);
  const { orderId, paymentId, signature } = req.body;

  if (!orderId || !paymentId || !signature) {
    res.status(400).json({ error: "orderId, paymentId, and signature are required" });
    return;
  }

  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  const [pendingOrder] = await db
    .select()
    .from(razorpayOrdersTable)
    .where(and(eq(razorpayOrdersTable.orderId, orderId), eq(razorpayOrdersTable.userId, user.id)));

  if (!pendingOrder || !pendingOrder.productId) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [cosmetic] = await db
    .insert(userCosmeticsTable)
    .values({ userId: user.id, productId: pendingOrder.productId })
    .returning();

  await db
    .insert(purchasesTable)
    .values({
      userId: user.id,
      productId: pendingOrder.productId,
      paymentId,
      orderId,
      amountPaid: pendingOrder.amount,
    });

  await db
    .update(razorpayOrdersTable)
    .set({ status: "paid" })
    .where(eq(razorpayOrdersTable.orderId, orderId));

  res.json({ success: true, cosmeticId: cosmetic.id });
});

// ── Cosmetic: equip/unequip ───────────────────────────────────────────────────
router.patch("/monetization/cosmetic/:productId/equip", requireAuth, async (req, res): Promise<void> => {
  const user = await getOrCreateUser((req as any).replitUserId);
  const productId = parseInt(req.params.productId as string, 10);
  const { equip } = req.body;

  const [owned] = await db
    .select()
    .from(userCosmeticsTable)
    .where(and(eq(userCosmeticsTable.userId, user.id), eq(userCosmeticsTable.productId, productId)));

  if (!owned) {
    res.status(403).json({ error: "You do not own this item" });
    return;
  }

  await db
    .update(userCosmeticsTable)
    .set({ isEquipped: !!equip })
    .where(and(eq(userCosmeticsTable.userId, user.id), eq(userCosmeticsTable.productId, productId)));

  res.json({ success: true, isEquipped: !!equip });
});

// ── Razorpay Webhook ──────────────────────────────────────────────────────────
router.post("/monetization/webhook", async (req, res): Promise<void> => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const rawBody = JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  const event = req.body;

  if (event.event === "payment.failed") {
    const orderId = event.payload?.payment?.entity?.order_id;
    if (orderId) {
      await db
        .update(razorpayOrdersTable)
        .set({ status: "failed" })
        .where(eq(razorpayOrdersTable.orderId, orderId));
    }
  }

  if (event.event === "subscription.cancelled") {
    const subId = event.payload?.subscription?.entity?.id;
    if (subId) {
      await db
        .update(subscriptionsTable)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(subscriptionsTable.razorpaySubscriptionId, subId));
    }
  }

  res.json({ ok: true });
});

// ── Admin: revenue dashboard ──────────────────────────────────────────────────
router.get("/admin/revenue", requireAuth, async (req, res): Promise<void> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [founderStats] = await db
    .select({ total: count(), totalRevenue: sum(sql`${FOUNDER_PASS_PRICE}`) })
    .from(founderPassesTable);

  const [subStats] = await db
    .select({ total: count() })
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.status, "active"), sql`${subscriptionsTable.expiryDate} > ${now}`));

  const [monthlySubStats] = await db
    .select({ total: count() })
    .from(subscriptionsTable)
    .where(sql`${subscriptionsTable.startDate} >= ${startOfMonth}`);

  const [cosmeticStats] = await db
    .select({ total: count(), totalRevenue: sum(purchasesTable.amountPaid) })
    .from(purchasesTable);

  const [cancelledStats] = await db
    .select({ total: count() })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.status, "cancelled"));

  const topProducts = await db
    .select({ productId: purchasesTable.productId, sales: count() })
    .from(purchasesTable)
    .groupBy(purchasesTable.productId)
    .orderBy(desc(count()))
    .limit(5);

  const topProductIds = topProducts.map((p) => p.productId);
  let productNames: Record<number, string> = {};
  if (topProductIds.length > 0) {
    const products = await db.select({ id: productsTable.id, name: productsTable.name }).from(productsTable);
    productNames = Object.fromEntries(products.map((p) => [p.id, p.name]));
  }

  const founderRevenuePaise = Number(founderStats.total) * FOUNDER_PASS_PRICE;
  const subRevenuePaise = Number(subStats.total) * PREMIUM_PRICE;
  const cosmeticRevenuePaise = Number(cosmeticStats.totalRevenue ?? 0);
  const totalRevenuePaise = founderRevenuePaise + subRevenuePaise + cosmeticRevenuePaise;

  const totalUsers = await db.select({ total: count() }).from(usersTable);
  const conversionRate =
    Number(totalUsers[0].total) > 0
      ? (((Number(founderStats.total) + Number(subStats.total)) / Number(totalUsers[0].total)) * 100).toFixed(1)
      : "0.0";

  res.json({
    totalRevenueInr: (totalRevenuePaise / 100).toFixed(2),
    monthlyRevenueInr: ((Number(monthlySubStats.total) * PREMIUM_PRICE) / 100).toFixed(2),
    activeSubscribers: Number(subStats.total),
    founderPassSold: Number(founderStats.total),
    founderPassRemaining: FOUNDER_PASS_LIMIT - Number(founderStats.total),
    cosmeticSales: Number(cosmeticStats.total),
    cancelledSubscriptions: Number(cancelledStats.total),
    conversionRate,
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      name: productNames[p.productId!] ?? "Unknown",
      sales: Number(p.sales),
    })),
  });
});

export default router;
