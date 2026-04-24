import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { isAuthenticated } from "../auth/middleware";
import { db } from "../db";
import { wallets, transactions, dataPlans, users } from "../db/schema";
import { eq, desc, sql, and, ilike } from "drizzle-orm";

const router = Router();
router.use(isAuthenticated);

// ─── Get Data Plans ──────────────────────────────────────────────────────────
router.get("/plans/data", async (_req: Request, res: Response) => {
  const plans = await db
    .select()
    .from(dataPlans)
    .where(eq(dataPlans.isActive, true))
    .orderBy(dataPlans.network, dataPlans.price);

  const grouped = plans.reduce((acc: any, plan) => {
    if (!acc[plan.network]) acc[plan.network] = [];
    acc[plan.network].push({
      id: plan.id,
      name: plan.name,
      data: plan.dataAmount,
      validity: plan.validity,
      price: plan.price,
      priceFormatted: `₦${(plan.price / 100).toLocaleString()}`,
    });
    return acc;
  }, {});

  res.json({ plans: grouped });
});

// ─── Buy Data ────────────────────────────────────────────────────────────────
router.post("/buy-data", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { planId, phoneNumber, pin } = req.body;

    if (!planId || !phoneNumber || !pin) {
      return res.status(400).json({ error: "Plan, phone number, and PIN are required" });
    }

    // Verify PIN
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const pinValid = await bcrypt.compare(pin, user.pinHash);
    if (!pinValid) return res.status(403).json({ error: "Invalid transaction PIN" });

    // Get plan
    const [plan] = await db.select().from(dataPlans).where(eq(dataPlans.id, planId));
    if (!plan) return res.status(404).json({ error: "Data plan not found" });

    // Check wallet balance
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    if (wallet.balance < plan.price) {
      return res.status(400).json({ error: "Insufficient balance", required: plan.price, available: wallet.balance });
    }

    // Deduct balance
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} - ${plan.price}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Create transaction
    const ref = `DATA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const [tx] = await db
      .insert(transactions)
      .values({
        userId,
        type: "data",
        network: plan.network,
        phoneNumber,
        amount: plan.price,
        plan: `${plan.dataAmount} - ${plan.validity}`,
        status: "completed",
        reference: ref,
        description: `${plan.network} ${plan.dataAmount} data for ${phoneNumber}`,
      })
      .returning();

    res.json({
      message: "Data purchase successful",
      transaction: {
        id: tx.id,
        reference: ref,
        network: plan.network,
        plan: `${plan.dataAmount} - ${plan.validity}`,
        amount: `₦${(plan.price / 100).toLocaleString()}`,
        phone: phoneNumber,
        status: "completed",
        date: tx.createdAt,
      },
    });
  } catch (err) {
    console.error("Buy data error:", err);
    res.status(500).json({ error: "Data purchase failed" });
  }
});

// ─── Buy Airtime ─────────────────────────────────────────────────────────────
router.post("/buy-airtime", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { amount, network, phoneNumber, pin } = req.body;

    if (!amount || !network || !phoneNumber || !pin) {
      return res.status(400).json({ error: "Amount, network, phone, and PIN are required" });
    }

    // Verify PIN
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const pinValid = await bcrypt.compare(pin, user.pinHash);
    if (!pinValid) return res.status(403).json({ error: "Invalid transaction PIN" });

    const amountKobo = Math.round(amount * 100);

    // Check wallet
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    if (wallet.balance < amountKobo) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Deduct
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} - ${amountKobo}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Record
    const ref = `AIR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const [tx] = await db
      .insert(transactions)
      .values({
        userId,
        type: "airtime",
        network,
        phoneNumber,
        amount: amountKobo,
        status: "completed",
        reference: ref,
        description: `${network} ₦${amount} airtime for ${phoneNumber}`,
      })
      .returning();

    res.json({
      message: "Airtime purchase successful",
      transaction: {
        id: tx.id,
        reference: ref,
        network,
        amount: `₦${amount.toLocaleString()}`,
        phone: phoneNumber,
        status: "completed",
        date: tx.createdAt,
      },
    });
  } catch (err) {
    console.error("Buy airtime error:", err);
    res.status(500).json({ error: "Airtime purchase failed" });
  }
});

// ─── Transaction History ─────────────────────────────────────────────────────
router.get("/history", async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { type, page = "1", limit = "20" } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  let query = db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limitNum)
    .offset(offset);

  const txs = await query;

  // Filter by type in-app if needed (Drizzle dynamic where is more complex)
  const filtered = type && type !== "all"
    ? txs.filter((t) => t.type === type)
    : txs;

  res.json({
    transactions: filtered.map((t) => ({
      id: t.id,
      type: t.type,
      network: t.network,
      phoneNumber: t.phoneNumber,
      amount: t.amount,
      amountFormatted: `₦${(t.amount / 100).toLocaleString()}`,
      plan: t.plan,
      status: t.status,
      reference: t.reference,
      description: t.description,
      createdAt: t.createdAt,
    })),
    page: pageNum,
    hasMore: txs.length === limitNum,
  });
});

// ─── Single Transaction ──────────────────────────────────────────────────────
router.get("/history/:id", async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const txId = parseInt(req.params.id as string);

  const [tx] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, userId)));

  if (!tx) return res.status(404).json({ error: "Transaction not found" });

  res.json({ transaction: tx });
});

export default router;
