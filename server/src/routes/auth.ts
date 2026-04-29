import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import passport from "../auth/passport";
import { db } from "../db";
import { users, wallets, rewards, otpCodes } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendOtp, verifyOtp } from "../services/termii";
import { generateToken } from "../auth/middleware";

const router = Router();

// ─── Send OTP ────────────────────────────────────────────────────────────────
router.post("/send-otp", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    const fullPhone = phone.startsWith("+234") ? phone : `+234${phone.replace(/^0/, "")}`;

    // Rate limit: max 3 OTPs per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCodes = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.phone, fullPhone), gt(otpCodes.createdAt, oneHourAgo)));

    if (recentCodes.length >= 3) {
      return res.status(429).json({ error: "Too many OTP requests. Try again later." });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send via Termii (or mock in dev)
    const pinId = await sendOtp(fullPhone, code);

    // Store in DB
    await db.insert(otpCodes).values({
      phone: fullPhone,
      code,
      pinId,
      expiresAt,
    });

    res.json({ message: "OTP sent successfully", phone: fullPhone });
  } catch (err: any) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ─── Verify OTP ──────────────────────────────────────────────────────────────
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: "Phone and code are required" });

    const fullPhone = phone.startsWith("+234") ? phone : `+234${phone.replace(/^0/, "")}`;

    const [otpRecord] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, fullPhone),
          eq(otpCodes.code, code),
          eq(otpCodes.verified, false)
        )
      )
      .orderBy(otpCodes.createdAt)
      .limit(1);

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(400).json({ error: "Too many attempts. Request a new OTP." });
    }

    // Mark as verified
    await db
      .update(otpCodes)
      .set({ verified: true })
      .where(eq(otpCodes.id, otpRecord.id));

    res.json({ message: "Phone verified successfully", verified: true });
  } catch (err: any) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ─── Register ────────────────────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { phone, password, pin, fullName } = req.body;
    if (!phone || !password || !pin) {
      return res.status(400).json({ error: "Phone, password, and PIN are required" });
    }

    const fullPhone = phone.startsWith("+234") ? phone : `+234${phone.replace(/^0/, "")}`;

    // TEMPORARILY DISABLED: Check phone is verified via OTP
    /*
    const [verified] = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.phone, fullPhone), eq(otpCodes.verified, true)))
      .limit(1);

    if (!verified) {
      return res.status(400).json({ error: "Phone number not verified. Complete OTP first." });
    }
    */

    // Check if user already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.phone, fullPhone))
      .limit(1);

    if (existing) {
      return res.status(409).json({ error: "An account with this phone already exists" });
    }

    // Hash credentials
    const passwordHash = await bcrypt.hash(password, 12);
    const pinHash = await bcrypt.hash(pin, 12);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        phone: fullPhone,
        passwordHash,
        pinHash,
        fullName: fullName || "",
        isVerified: true,
        welcomeBonusClaimed: true,
      })
      .returning();

    // Create wallet with welcome bonus (equivalent to 1GB in points = ₦250 = 25000 kobo)
    await db.insert(wallets).values({
      userId: newUser.id,
      balance: 25000, // ₦250 welcome bonus
    });

    // Initialize rewards
    await db.insert(rewards).values({
      userId: newUser.id,
      totalPoints: 50, // Welcome bonus points
    });

    // Generate JWT token
    const token = generateToken(newUser.id);
    const { passwordHash: _, pinHash: __, ...safeUser } = newUser;

    // Also log in via session (for backward compat)
    req.login(newUser, (err) => {
      if (err) console.warn("Session login failed (JWT still valid):", err);
      res.status(201).json({
        message: "Account created successfully! Welcome bonus credited.",
        user: safeUser,
        token,
        welcomeBonus: { data: "1GB", walletCredit: "₦250" },
      });
    });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post("/login", (req: Request, res: Response, next) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });

    // Generate JWT token
    const token = generateToken(user.id);
    const { passwordHash, pinHash, ...safeUser } = user;

    // Also log in via session (for backward compat)
    req.login(user, (loginErr) => {
      if (loginErr) console.warn("Session login failed (JWT still valid):", loginErr);
      res.json({ message: "Logged in successfully", user: safeUser, token });
    });
  })(req, res, next);
});

// ─── Logout ──────────────────────────────────────────────────────────────────
router.post("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    req.session.destroy((err) => {
      res.json({ message: "Logged out successfully" });
    });
  });
});

// ─── Current User ────────────────────────────────────────────────────────────
router.get("/me", (req: Request, res: Response) => {
  const isJwtAuth = (req as any)._jwtAuthenticated;
  const isSessionAuth = req.isAuthenticated && req.isAuthenticated();
  if (!isJwtAuth && !isSessionAuth) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: req.user });
});

export default router;
