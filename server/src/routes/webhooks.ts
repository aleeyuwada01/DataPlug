import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db";
import { wallets, transactions, users } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyTransaction } from "../services/flutterwave";

const router = Router();

// Retrieve Flutterwave Secret Hash for webhook signature verification
const FLUTTERWAVE_HASH = process.env.FLUTTERWAVE_HASH || "";

function isValidFlutterwaveWebhook(rawBody: string, signature: string, secretHash: string) {
  // Handle HMAC-SHA256 (new method)
  const hash = crypto
    .createHmac('sha256', secretHash)
    .update(rawBody)
    .digest('base64');

  if (hash === signature) return true;

  // Fallback to plain text matching (old method, verif-hash)
  if (signature === secretHash) return true;

  return false;
}

router.post("/flutterwave", async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody;
    const signature = req.headers["flutterwave-signature"] || req.headers["verif-hash"];

    if (FLUTTERWAVE_HASH) {
      if (!signature || !isValidFlutterwaveWebhook(rawBody, signature as string, FLUTTERWAVE_HASH)) {
        console.warn("Invalid Flutterwave webhook signature detected.");
        return res.status(401).send("Unauthorized webhook");
      }
    }

    // Acknowledge receipt of webhook immediately to prevent timeouts
    res.status(200).send("OK");

    const event = req.body;

    // Process event asynchronously
    processWebhookEvent(event).catch((err) => {
      console.error("Error processing webhook asynchronously:", err);
    });

  } catch (err) {
    console.error("Webhook route error:", err);
    if (!res.headersSent) {
      res.status(500).send("Internal error");
    }
  }
});

async function processWebhookEvent(event: any) {
  if (event.type === "charge.completed" || event.event === "charge.completed") {
    if (event.data.status !== "successful" && event.data.status !== "succeeded") {
      return;
    }

    const chargeId = event.data.id;
    const reference = event.data.tx_ref || event.data.reference; // Sometimes named tx_ref

    // 1. Verify the charge (API Re-query Best Practice)
    const verifiedCharge = await verifyTransaction(chargeId);

    if ((verifiedCharge.status !== "successful" && verifiedCharge.status !== "succeeded") || 
         verifiedCharge.tx_ref !== reference) {
      console.error("Flutterwave charge verification failed for reference:", reference);
      return;
    }

    // Convert to Kobo
    const verifiedAmountKobo = Math.round(verifiedCharge.amount * 100);

    // 2. Check Idempotency and Pending Transactions
    const [existingTx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reference, reference));

    if (existingTx) {
      if (existingTx.status === "completed") {
        console.log(`Transaction ${reference} already completed (idempotent ignore)`);
        return;
      }

      if (existingTx.status === "pending" && existingTx.type === "fund") {
        // Complete the dynamic transfer
        await db.transaction(async (txDb) => {
          await txDb
            .update(transactions)
            .set({ status: "completed", amount: verifiedAmountKobo })
            .where(eq(transactions.id, existingTx.id));

          await txDb
            .update(wallets)
            .set({
              balance: sql`${wallets.balance} + ${verifiedAmountKobo}`,
              updatedAt: new Date(),
            })
            .where(eq(wallets.userId, existingTx.userId));
        });
        console.log(`Successfully credited wallet for pending tx ${reference}`);
        return;
      }
    } else {
      // 3. Handle Static Virtual Account Transfers (No prior pending transaction)
      let userId: number | null = null;
      const email = verifiedCharge.customer?.email || "";
      const meta = verifiedCharge.meta || {};
      
      const emailMatch = email.match(/^user(\d+)@dataplug\.app$/);
      if (emailMatch) {
        userId = parseInt(emailMatch[1], 10);
      } else {
        // Try fallback lookup by BVN if attached, or customer ID if we stored it
        // Or better, look up by virtual account number from the webhook data
        console.log("Static transfer webhook meta/customer data:", JSON.stringify(verifiedCharge.customer));
      }

      if (userId) {
        // Create the completed transaction directly
        await db.transaction(async (txDb) => {
          await txDb.insert(transactions).values({
            userId: userId as number,
            type: "fund",
            amount: verifiedAmountKobo,
            status: "completed",
            reference: reference,
            description: `Bank Transfer of ₦${verifiedCharge.amount.toLocaleString()}`,
          });

          await txDb
            .update(wallets)
            .set({
              balance: sql`${wallets.balance} + ${verifiedAmountKobo}`,
              updatedAt: new Date(),
            })
            .where(eq(wallets.userId, userId as number));
        });
        console.log(`Successfully processed static account transfer for user ${userId}, ref ${reference}`);
      } else {
        console.warn(`Could not resolve user for static account transfer. Email: ${email}`);
      }
    }
  }
}

export default router;
