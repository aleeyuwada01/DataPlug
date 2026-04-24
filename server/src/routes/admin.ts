import { Router, Request, Response } from "express";
import { isAdmin } from "../auth/middleware";
import { db } from "../db";
import { users, wallets, transactions, rewards, checkIns, dataPlans } from "../db/schema";
import { eq, desc, sql, count, sum } from "drizzle-orm";

const router = Router();
router.use(isAdmin);

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [txCount] = await db.select({ count: count() }).from(transactions);
    const [txSum] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, "data"));

    const [airtimeSum] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, "airtime"));

    // Today's signups
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    res.json({
      totalUsers: userCount.count,
      totalTransactions: txCount.count,
      totalDataRevenue: txSum.total ? Number(txSum.total) : 0,
      totalAirtimeRevenue: airtimeSum.total ? Number(airtimeSum.total) : 0,
      totalRevenueFormatted: `₦${(((Number(txSum.total || 0) + Number(airtimeSum.total || 0)) / 100)).toLocaleString()}`,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── List Users ──────────────────────────────────────────────────────────────
router.get("/users", async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20", search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const allUsers = await db
      .select({
        id: users.id,
        phone: users.phone,
        fullName: users.fullName,
        isVerified: users.isVerified,
        isAdmin: users.isAdmin,
        welcomeBonusClaimed: users.welcomeBonusClaimed,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limitNum)
      .offset(offset);

    res.json({
      users: allUsers,
      page: pageNum,
      hasMore: allUsers.length === limitNum,
    });
  } catch (err) {
    console.error("Admin list users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ─── Get User Detail ─────────────────────────────────────────────────────────
router.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string);

    const [user] = await db
      .select({
        id: users.id,
        phone: users.phone,
        fullName: users.fullName,
        isVerified: users.isVerified,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return res.status(404).json({ error: "User not found" });

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    const [reward] = await db.select().from(rewards).where(eq(rewards.userId, userId));

    const recentTxs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    res.json({
      user,
      wallet: wallet ? { balance: wallet.balance, balanceFormatted: `₦${(wallet.balance / 100).toLocaleString()}` } : null,
      rewards: reward || null,
      recentTransactions: recentTxs,
    });
  } catch (err) {
    console.error("Admin user detail error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ─── Toggle Admin / Grant Bonus ──────────────────────────────────────────────
router.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string);
    const { isAdmin: makeAdmin, bonusAmount } = req.body;

    if (typeof makeAdmin === "boolean") {
      await db.update(users).set({ isAdmin: makeAdmin }).where(eq(users.id, userId));
    }

    if (bonusAmount && bonusAmount > 0) {
      const amountKobo = Math.round(bonusAmount * 100);
      await db
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${amountKobo}` })
        .where(eq(wallets.userId, userId));

      await db.insert(transactions).values({
        userId,
        type: "fund",
        amount: amountKobo,
        status: "completed",
        reference: `ADMIN-BONUS-${Date.now()}`,
        description: `Admin bonus of ₦${bonusAmount}`,
      });
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Admin update user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ─── All Transactions ────────────────────────────────────────────────────────
router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "50" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const txs = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limitNum)
      .offset(offset);

    res.json({ transactions: txs, page: pageNum, hasMore: txs.length === limitNum });
  } catch (err) {
    console.error("Admin transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ─── Manage Data Plans ───────────────────────────────────────────────────────
router.post("/plans", async (req: Request, res: Response) => {
  try {
    const { network, name, dataAmount, validity, price } = req.body;
    const [plan] = await db
      .insert(dataPlans)
      .values({ network, name, dataAmount, validity, price: Math.round(price * 100) })
      .returning();
    res.status(201).json({ plan });
  } catch (err) {
    console.error("Admin add plan error:", err);
    res.status(500).json({ error: "Failed to add plan" });
  }
});

router.patch("/plans/:id", async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id as string);
    const { isActive, price } = req.body;

    const updates: any = {};
    if (typeof isActive === "boolean") updates.isActive = isActive;
    if (price) updates.price = Math.round(price * 100);

    await db.update(dataPlans).set(updates).where(eq(dataPlans.id, planId));
    res.json({ message: "Plan updated" });
  } catch (err) {
    console.error("Admin update plan error:", err);
    res.status(500).json({ error: "Failed to update plan" });
  }
});

export default router;
