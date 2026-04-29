import { randomUUID } from "crypto";

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";
const SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || "";
const PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || "";

/**
 * Generates a static virtual account for a user using their BVN.
 */
export async function generateStaticVirtualAccount(user: {
  id: number;
  fullName: string;
  phone: string;
  bvn: string;
}) {
  const email = `user${user.id}@dataplug.app`;
  const [first = "DataPlug", ...lastParts] = (user.fullName || "").split(" ");
  const last = lastParts.join(" ") || "User";

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/virtual-account-numbers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      email,
      is_permanent: true,
      bvn: user.bvn,
      tx_ref: `static-${user.id}-${Date.now()}`,
      phonenumber: user.phone,
      firstname: first,
      lastname: last,
      narration: `${first} ${last}`,
    }),
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    console.error("Flutterwave create static virtual account error:", data);
    throw new Error(data.message || "Failed to generate static virtual account");
  }

  return data.data; // Contains account_number, bank_name, etc.
}

/**
 * Generates a dynamic virtual account for one-time funding.
 */
export async function generateDynamicVirtualAccount(user: {
  id: number;
  fullName: string;
  phone: string;
}, amount: number, reference: string) {
  const email = `user${user.id}@dataplug.app`;
  const [first = "DataPlug", ...lastParts] = (user.fullName || "").split(" ");
  const last = lastParts.join(" ") || "User";

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/virtual-account-numbers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      email,
      is_permanent: false,
      amount,
      tx_ref: reference,
      phonenumber: user.phone,
      firstname: first,
      lastname: last,
      narration: "DataPlug Wallet Fund",
    }),
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    console.error("Flutterwave create dynamic virtual account error:", data);
    throw new Error(data.message || "Failed to generate virtual account");
  }

  return data.data; // Contains account_number, bank_name, amount, etc.
}

/**
 * Verifies a Flutterwave transaction by its ID.
 * Uses the correct endpoint: GET /v3/transactions/{id}/verify
 */
export async function verifyTransaction(transactionId: string | number) {
  console.log(`[FLW] Verifying transaction ID: ${transactionId}`);

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      Accept: "application/json",
    },
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    console.error("[FLW] Verify transaction error:", data);
    throw new Error(data.message || "Failed to verify transaction");
  }

  console.log(`[FLW] Verified transaction:`, {
    status: data.data?.status,
    amount: data.data?.amount,
    tx_ref: data.data?.tx_ref,
    customer_email: data.data?.customer?.email,
  });

  return data.data; // Contains status, amount, tx_ref, customer, etc.
}

// Keep old name as alias for backward compat
export const verifyCharge = verifyTransaction;

/**
 * Fetches list of Nigerian banks.
 */
export async function getNGBanks() {
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/banks/NG`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      Accept: "application/json",
    },
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    console.error("Flutterwave get banks error:", data);
    throw new Error(data.message || "Failed to fetch banks");
  }

  return data.data; // Array of { id, code, name }
}

/**
 * Initializes a Flutterwave Standard payment.
 * Returns a payment link that redirects the user to Flutterwave's hosted checkout.
 * Supports: Card, Bank Transfer, USSD, OPay, and more.
 */
export async function initializePayment(params: {
  amount: number;
  email: string;
  fullName: string;
  phone: string;
  reference: string;
  redirectUrl: string;
  title?: string;
  description?: string;
}) {
  console.log(`[FLW] Initializing payment: amount=${params.amount}, ref=${params.reference}`);

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      tx_ref: params.reference,
      amount: params.amount,
      currency: "NGN",
      redirect_url: params.redirectUrl,
      payment_options: "card,banktransfer,ussd,opay",
      customer: {
        email: params.email,
        phonenumber: params.phone,
        name: params.fullName,
      },
      customizations: {
        title: params.title || "DataPlug Wallet Top-Up",
        description: params.description || `Fund your wallet with ₦${params.amount.toLocaleString()}`,
        logo: "https://dataplug-1.onrender.com/favicon.ico",
      },
      meta: {
        source: "dataplug-web",
      },
    }),
  });

  const data = (await response.json()) as any;

  if (!response.ok || data.status !== "success") {
    console.error("[FLW] Initialize payment error:", data);
    throw new Error(data.message || "Failed to initialize payment");
  }

  console.log(`[FLW] Payment link created: ${data.data?.link}`);

  return {
    paymentLink: data.data.link,
    reference: params.reference,
  };
}

/**
 * Initiates a USSD charge via Flutterwave v3 standard API.
 */
export async function initiateUSSDCharge(params: {
  amount: number;
  phoneNumber: string;
  email: string;
  fullName: string;
  bankCode: string;
  reference: string;
}) {
  console.log(`[FLW] Initiating USSD charge: amount=${params.amount}, bank=${params.bankCode}`);

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/charges?type=ussd`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      tx_ref: params.reference,
      account_bank: params.bankCode,
      amount: params.amount,
      currency: "NGN",
      email: params.email,
      phone_number: params.phoneNumber,
      fullname: params.fullName,
    }),
  });

  const data = (await response.json()) as any;

  if (!response.ok || data.status === "error") {
    console.error("[FLW] USSD charge error:", data);
    throw new Error(data.message || "Failed to initiate USSD charge");
  }

  console.log("[FLW] USSD charge response:", JSON.stringify(data.data, null, 2));

  return {
    ussdCode: data.meta?.authorization?.note || data.data?.payment_code || "Dial your bank's USSD code",
    reference: params.reference,
    id: data.data?.id,
  };
}

/**
 * Initiates an OPay charge — uses Flutterwave Standard payment link.
 */
export async function initiateOPayCharge(params: {
  amount: number;
  email: string;
  fullName: string;
  phone: string;
  reference: string;
  redirectUrl: string;
}) {
  // OPay is handled via Flutterwave Standard checkout
  return initializePayment({
    ...params,
    title: "DataPlug - OPay Payment",
    description: `Fund wallet with ₦${params.amount.toLocaleString()} via OPay`,
  });
}
