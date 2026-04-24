import { Router, Request, Response } from "express";
import { isAuthenticated } from "../auth/middleware";
import { db } from "../db";
import { wallets, transactions, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateStaticVirtualAccount, getNGBanks, initiateUSSDCharge, initiateOPayCharge } from "../services/flutterwave";

const router = Router();
router.use(isAuthenticated);

// ─── Get Wallet Balance & Static Account ─────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  const [userRecord] = await db.select().from(users).where(eq(users.id, userId));

  if (!wallet || !userRecord) return res.status(404).json({ error: "Wallet or user not found" });

  res.json({
    balance: wallet.balance,
    balanceFormatted: `₦${(wallet.balance / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
    currency: wallet.currency,
    virtualAccountNumber: userRecord.virtualAccountNumber,
    virtualBankName: userRecord.virtualBankName,
    bvn: userRecord.bvn,
  });
});

// ─── Generate Static Virtual Account ─────────────────────────────────────────
router.post("/static-account", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { bvn } = req.body;

    if (!bvn || bvn.length < 10) {
      return res.status(400).json({ error: "Valid BVN is required" });
    }

    // Check if user already has an account
    const [existingUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (existingUser?.virtualAccountNumber) {
      return res.json({
        message: "Virtual account already exists",
        account: {
          accountNumber: existingUser.virtualAccountNumber,
          bankName: existingUser.virtualBankName,
        }
      });
    }

    // Generate Static Virtual Account
    const accountDetails = await generateStaticVirtualAccount({
      id: user.id,
      fullName: user.fullName || "DataPlug User",
      phone: user.phone,
      bvn: bvn,
    });

    // Update DB
    await db.update(users).set({
      bvn: bvn,
      virtualAccountNumber: accountDetails.account_number,
      virtualBankName: accountDetails.bank_name,
    }).where(eq(users.id, user.id));

    res.json({
      message: "Virtual account generated successfully",
      account: {
        accountNumber: accountDetails.account_number,
        bankName: accountDetails.bank_name,
      },
    });
  } catch (err: any) {
    console.error("Generate static account error:", err);
    res.status(500).json({ error: err.message || "Failed to generate virtual account" });
  }
});

// ─── Fund Wallet (Dynamic Virtual Account) ──────────────────────────────────
router.post("/fund", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const amountKobo = Math.round(amount * 100);
    const ref = `FUND-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Generate Dynamic Virtual Account
    const { generateDynamicVirtualAccount } = await import("../services/flutterwave");
    const accountDetails = await generateDynamicVirtualAccount({
      id: user.id,
      fullName: user.fullName || "DataPlug User",
      phone: user.phone,
    }, amount, ref);

    // Record pending transaction
    await db.insert(transactions).values({
      userId: user.id,
      type: "fund",
      amount: amountKobo,
      status: "pending",
      reference: ref,
      description: `Wallet top-up of ₦${amount.toLocaleString()}`,
    });

    res.json({
      message: "Virtual account generated successfully",
      account: {
        bankName: accountDetails.bank_name,
        accountNumber: accountDetails.account_number,
        amount: accountDetails.amount,
        expiry: accountDetails.expiry_date,
        note: accountDetails.note || "Please transfer exactly the specified amount",
      },
      reference: ref,
    });
  } catch (err: any) {
    console.error("Fund wallet error:", err);
    res.status(500).json({ error: err.message || "Failed to generate funding account" });
  }
});

// ─── Get Banks (for USSD) ───────────────────────────────────────────────────
router.get("/banks", async (_req: Request, res: Response) => {
  try {
    const banks = await getNGBanks();
    // Filter to only banks that commonly support USSD
    res.json({ banks });
  } catch (err: any) {
    console.error("Get banks error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch banks" });
  }
});

// ─── Initiate USSD Payment ──────────────────────────────────────────────────
router.post("/ussd-v2", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { amount, bankCode } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    if (!bankCode) {
      return res.status(400).json({ error: "Bank code is required" });
    }

    const numAmount = Number(amount);
    const amountKobo = Math.round(numAmount * 100);
    const ref = `USSD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const email = `user${user.id}@dataplug.app`;

    const { ussdCode, id } = await initiateUSSDCharge({
      amount: numAmount,
      phoneNumber: user.phone,
      email,
      fullName: user.fullName || "DataPlug User",
      bankCode,
      reference: ref,
    });

    // Record pending transaction
    await db.insert(transactions).values({
      userId: user.id,
      type: "fund",
      amount: amountKobo,
      status: "pending",
      reference: ref,
      description: `USSD top-up of ₦${numAmount.toLocaleString()}`,
    });

    res.json({
      message: "USSD charge initiated",
      ussdCode: ussdCode || "Dial your bank's transfer code",
      reference: ref,
      chargeId: id,
    });
  } catch (err: any) {
    console.error("USSD charge error:", err);
    res.status(500).json({ error: err.message || "Failed to initiate USSD payment" });
  }
});

// ─── Initiate OPay Payment ──────────────────────────────────────────────────
router.post("/opay", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { amount } = req.body;
    
    console.log(`[OPay] Initiating charge for user ${user.id}, amount: ${amount}`);

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const numAmount = Number(amount);
    const amountKobo = Math.round(numAmount * 100);
    const ref = `OPAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const email = `user${user.id}@dataplug.app`;
    
    const redirectUrl = `${process.env.CLIENT_URL || "http://localhost:8081"}/(tabs)?status=processing&ref=${ref}`;

    const chargeData = await initiateOPayCharge({
      amount: numAmount,
      email,
      fullName: user.fullName || "DataPlug User",
      phone: user.phone,
      reference: ref,
      redirectUrl,
    });

    // Record pending transaction
    await db.insert(transactions).values({
      userId: user.id,
      type: "fund",
      amount: amountKobo,
      status: "pending",
      reference: ref,
      description: `OPay top-up of ₦${numAmount.toLocaleString()}`,
    });

    res.json({
      message: "OPay charge initiated",
      redirectUrl: chargeData.redirectUrl,
      reference: ref,
      chargeId: chargeData.chargeId,
    });
  } catch (err: any) {
    console.error("OPay charge error:", err);
    res.status(500).json({ error: err.message || "Failed to initiate OPay payment" });
  }
});

export default router;
