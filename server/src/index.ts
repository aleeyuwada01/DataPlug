import express from "express";
import session from "express-session";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectPgSimple from "connect-pg-simple";
import "dotenv/config";

import { pool } from "./db";
import passport from "./auth/passport";
import authRoutes from "./routes/auth";
import walletRoutes from "./routes/wallet";
import transactionRoutes from "./routes/transactions";
import rewardRoutes from "./routes/rewards";
import adminRoutes from "./routes/admin";
import webhookRoutes from "./routes/webhooks";
import { seedDataPlans } from "./db/seed";

const app = express();
const PORT = parseInt(process.env.PORT || "3001");
const isProd = process.env.NODE_ENV === "production";

// ─── Trust proxy (required for Render / reverse proxies) ─────────────────────
if (isProd) {
  app.set("trust proxy", 1);
}

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: isProd
      ? process.env.CLIENT_URL
      : (origin, callback) => callback(null, true),
    credentials: true,
  })
);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: false }));

// ─── Webhooks ────────────────────────────────────────────────────────────────
app.use("/api/webhooks", webhookRoutes);

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/auth", authLimiter);

// ─── Session ─────────────────────────────────────────────────────────────────
const PgStore = connectPgSimple(session);

app.use(
  session({
    store: new PgStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "dataplug-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? "lax" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

// ─── Passport ────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/admin", adminRoutes);

// ─── Root Route ──────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the DataPlug API" });
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "DataPlug API",
    version: "1.0.1",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Test database connection
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL (Neon)");
    client.release();

    // Seed data
    console.log("🌱 Seeding data...");
    await seedDataPlans();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 DataPlug API Server running on port ${PORT}`);
      console.log(`   Environment: ${isProd ? "production" : "development"}`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
