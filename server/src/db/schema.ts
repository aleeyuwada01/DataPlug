import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  varchar,
  date,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    pinHash: text("pin_hash").notNull(),
    fullName: varchar("full_name", { length: 100 }).default(""),
    isVerified: boolean("is_verified").default(false).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    welcomeBonusClaimed: boolean("welcome_bonus_claimed")
      .default(false)
      .notNull(),
    profileImage: text("profile_image"),
    bvn: varchar("bvn", { length: 20 }),
    virtualAccountNumber: varchar("virtual_account_number", { length: 50 }),
    virtualBankName: varchar("virtual_bank_name", { length: 100 }),
    flutterwaveCustomerId: varchar("flutterwave_customer_id", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    phoneIdx: uniqueIndex("users_phone_idx").on(table.phone),
  })
);

// ─── Wallets ─────────────────────────────────────────────────────────────────
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  // Balance stored in kobo (smallest unit) to avoid floating point
  balance: bigint("balance", { mode: "number" }).default(0).notNull(),
  currency: varchar("currency", { length: 3 }).default("NGN").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Transactions ────────────────────────────────────────────────────────────
export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 20 }).notNull(), // data, airtime, fund, gift
    network: varchar("network", { length: 20 }), // MTN, GLO, AIRTEL, 9MOBILE
    phoneNumber: varchar("phone_number", { length: 20 }),
    amount: integer("amount").notNull(), // in kobo
    plan: varchar("plan", { length: 100 }), // e.g. "1.5GB - 30 Days"
    status: varchar("status", { length: 20 }).default("completed").notNull(), // pending, completed, failed
    reference: varchar("reference", { length: 100 }),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("transactions_user_id_idx").on(table.userId),
    createdAtIdx: index("transactions_created_at_idx").on(table.createdAt),
  })
);

// ─── OTP Codes ───────────────────────────────────────────────────────────────
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  pinId: varchar("pin_id", { length: 100 }), // Termii pin_id for verification
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Check-ins ───────────────────────────────────────────────────────────────
export const checkIns = pgTable(
  "check_ins",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    rewardType: varchar("reward_type", { length: 20 }).default("data").notNull(),
    rewardValue: varchar("reward_value", { length: 50 })
      .default("200MB")
      .notNull(),
    pointsEarned: integer("points_earned").default(10).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userDateIdx: uniqueIndex("check_ins_user_date_idx").on(
      table.userId,
      table.date
    ),
  })
);

// ─── Rewards ─────────────────────────────────────────────────────────────────
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  totalPoints: integer("total_points").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  tier: varchar("tier", { length: 20 }).default("bronze").notNull(), // bronze, silver, gold
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Data Plans (seeded) ─────────────────────────────────────────────────────
export const dataPlans = pgTable("data_plans", {
  id: serial("id").primaryKey(),
  network: varchar("network", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  dataAmount: varchar("data_amount", { length: 20 }).notNull(), // e.g. "1.5GB"
  validity: varchar("validity", { length: 30 }).notNull(), // e.g. "30 Days"
  price: integer("price").notNull(), // in kobo
  isActive: boolean("is_active").default(true).notNull(),
});

// ─── Session table (created by connect-pg-simple, declared here for reference)
export const sessionTable = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});
