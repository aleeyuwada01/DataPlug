import { Router, Request, Response } from "express";
import { isAuthenticated } from "../auth/middleware";
import { db } from "../db";
import { checkIns, rewards, wallets } from "../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const router = Router();
router.use(isAuthenticated);

// ─── Get Rewards ─────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  const userId = (req.user as any).id;

  const [reward] = await db.select().from(rewards).where(eq(rewards.userId, userId));

  if (!reward) {
    return res.json({
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      tier: "bronze",
      todayCheckedIn: false,
    });
  }

  // Check if already claimed today
  const today = new Date().toISOString().split("T")[0];
  const [todayCheckIn] = await db
    .select()
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), eq(checkIns.date, today)));

  // Get recent check-in history (last 7 days)
  const recentCheckIns = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.userId, userId))
    .orderBy(desc(checkIns.date))
    .limit(7);

  res.json({
    totalPoints: reward.totalPoints,
    currentStreak: reward.currentStreak,
    longestStreak: reward.longestStreak,
    tier: reward.tier,
    todayCheckedIn: !!todayCheckIn,
    recentCheckIns: recentCheckIns.map((ci) => ({
      date: ci.date,
      reward: ci.rewardValue,
      points: ci.pointsEarned,
    })),
  });
});

// ─── Daily Check-in ──────────────────────────────────────────────────────────
router.post("/check-in", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const today = new Date().toISOString().split("T")[0];

    // Already claimed today?
    const [existing] = await db
      .select()
      .from(checkIns)
      .where(and(eq(checkIns.userId, userId), eq(checkIns.date, today)));

    if (existing) {
      return res.status(400).json({ error: "Already checked in today", alreadyClaimed: true });
    }

    // Get or create reward record
    let [reward] = await db.select().from(rewards).where(eq(rewards.userId, userId));

    if (!reward) {
      [reward] = await db
        .insert(rewards)
        .values({ userId, totalPoints: 0, currentStreak: 0, longestStreak: 0 })
        .returning();
    }

    // Check streak: was yesterday checked in?
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const [yesterdayCheckIn] = await db
      .select()
      .from(checkIns)
      .where(and(eq(checkIns.userId, userId), eq(checkIns.date, yesterday)));

    const newStreak = yesterdayCheckIn ? reward.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, reward.longestStreak);

    // Calculate points (streak multiplier)
    const basePoints = 10;
    const streakBonus = Math.min(newStreak, 7); // Cap at 7x
    const pointsEarned = basePoints * streakBonus;

    // Determine tier
    const newTotalPoints = reward.totalPoints + pointsEarned;
    let tier = "bronze";
    if (newTotalPoints >= 500) tier = "gold";
    else if (newTotalPoints >= 100) tier = "silver";

    // Create check-in
    await db.insert(checkIns).values({
      userId,
      date: today,
      rewardValue: "200MB",
      pointsEarned,
    });

    // Update rewards
    await db
      .update(rewards)
      .set({
        totalPoints: newTotalPoints,
        currentStreak: newStreak,
        longestStreak: newLongest,
        tier,
        updatedAt: new Date(),
      })
      .where(eq(rewards.userId, userId));

    res.json({
      message: "Check-in successful!",
      reward: "200MB",
      pointsEarned,
      streak: newStreak,
      totalPoints: newTotalPoints,
      tier,
    });
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ error: "Check-in failed" });
  }
});

// ─── Redeem Points ───────────────────────────────────────────────────────────
router.post("/redeem", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { points } = req.body;

    if (!points || points < 50) {
      return res.status(400).json({ error: "Minimum 50 points required to redeem" });
    }

    const [reward] = await db.select().from(rewards).where(eq(rewards.userId, userId));

    if (!reward || reward.totalPoints < points) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    // Convert points to wallet credit: 10 points = ₦50
    const creditKobo = Math.floor(points / 10) * 5000;

    // Deduct points
    await db
      .update(rewards)
      .set({
        totalPoints: sql`${rewards.totalPoints} - ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(rewards.userId, userId));

    // Credit wallet
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${creditKobo}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    res.json({
      message: `Redeemed ${points} points for ₦${(creditKobo / 100).toLocaleString()}`,
      pointsDeducted: points,
      walletCredit: creditKobo,
      walletCreditFormatted: `₦${(creditKobo / 100).toLocaleString()}`,
    });
  } catch (err) {
    console.error("Redeem error:", err);
    res.status(500).json({ error: "Redemption failed" });
  }
});

export default router;
