import { db } from "../db";
import { dataPlans } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Seeds the data_plans table with default MTN, GLO, Airtel, and 9Mobile plans.
 * Only runs if the table is empty.
 */
export async function seedDataPlans() {
  const existing = await db.select().from(dataPlans).limit(1);
  if (existing.length > 0) {
    console.log("  ✓ Data plans already seeded");
    return;
  }

  const plans = [
    // MTN
    { network: "MTN", name: "MTN 500MB", dataAmount: "500MB", validity: "30 Days", price: 15000 },
    { network: "MTN", name: "MTN 1GB", dataAmount: "1GB", validity: "30 Days", price: 25000 },
    { network: "MTN", name: "MTN 1.5GB", dataAmount: "1.5GB", validity: "30 Days", price: 45000 },
    { network: "MTN", name: "MTN 2GB", dataAmount: "2GB", validity: "30 Days", price: 55000 },
    { network: "MTN", name: "MTN 3GB", dataAmount: "3GB", validity: "30 Days", price: 75000 },
    { network: "MTN", name: "MTN 5GB", dataAmount: "5GB", validity: "30 Days", price: 120000 },
    { network: "MTN", name: "MTN 10GB", dataAmount: "10GB", validity: "30 Days", price: 250000 },
    // GLO
    { network: "GLO", name: "GLO 1GB", dataAmount: "1GB", validity: "30 Days", price: 23000 },
    { network: "GLO", name: "GLO 2GB", dataAmount: "2GB", validity: "30 Days", price: 50000 },
    { network: "GLO", name: "GLO 3.5GB", dataAmount: "3.5GB", validity: "30 Days", price: 70000 },
    { network: "GLO", name: "GLO 5GB", dataAmount: "5GB", validity: "30 Days", price: 100000 },
    // Airtel
    { network: "AIRTEL", name: "Airtel 1GB", dataAmount: "1GB", validity: "30 Days", price: 25000 },
    { network: "AIRTEL", name: "Airtel 2GB", dataAmount: "2GB", validity: "30 Days", price: 50000 },
    { network: "AIRTEL", name: "Airtel 5GB", dataAmount: "5GB", validity: "30 Days", price: 120000 },
    // 9mobile
    { network: "9MOBILE", name: "9mobile 1GB", dataAmount: "1GB", validity: "30 Days", price: 20000 },
    { network: "9MOBILE", name: "9mobile 2.5GB", dataAmount: "2.5GB", validity: "30 Days", price: 50000 },
  ];

  await db.insert(dataPlans).values(plans);
  console.log(`  ✓ Seeded ${plans.length} data plans`);
}
