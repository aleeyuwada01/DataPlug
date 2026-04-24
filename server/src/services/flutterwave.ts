import { randomUUID } from "crypto";

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";
// Use test keys for sandbox or live keys for production.
// We fallback to empty string so it doesn't crash on boot without a key.
const SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || "";

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
 * Verifies a Flutterwave charge.
 */
export async function verifyCharge(chargeId: string) {
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/charges/${chargeId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      Accept: "application/json",
    },
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    throw new Error("Failed to verify charge");
  }

  return data.data; // Contains status, amount, reference, etc.
}

/**
 * Fetches list of Nigerian banks for USSD bank selection.
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
 * Initiates a USSD charge using the Flutterwave Orchestrator flow (V2).
 * Returns the USSD string the user needs to dial.
 */
export async function initiateUSSDCharge(params: {
  amount: number;
  phoneNumber: string;
  email: string;
  fullName: string;
  bankCode: string;
  reference: string;
}) {
  // Step 1: Create or get customer
  const customer = await createFlwCustomer(params.email, params.fullName, params.phoneNumber);

  // Step 2: Create USSD payment method
  const pmRes = await fetch(`${FLW_V2_BASE}/payment-methods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      type: "ussd",
      ussd: {
        account_bank: params.bankCode,
      },
    }),
  });

  const pmData = (await pmRes.json()) as any;
  if (!pmRes.ok || pmData.status === "error") {
    console.error("FLW USSD payment method error:", pmData);
    throw new Error(pmData.message || "Failed to create USSD payment method");
  }
  const paymentMethodId = pmData.data.id;

  // Step 3: Create the charge
  const chargeRes = await fetch(`${FLW_V2_BASE}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      customer_id: customer.id,
      payment_method_id: paymentMethodId,
      amount: params.amount,
      currency: "NGN",
      reference: params.reference,
    }),
  });

  const chargeData = (await chargeRes.json()) as any;
  if (!chargeRes.ok || chargeData.status === "error") {
    console.error("FLW USSD charge error:", chargeData);
    throw new Error(chargeData.message || "Failed to initiate USSD charge");
  }

  // The code is in next_action.payment_instruction.note
  let ussdCode = chargeData.data?.next_action?.payment_instruction?.note || "";
  
  // Clean up the note if it contains extra text (Flutterwave notes often say "Please dial *...#")
  const match = ussdCode.match(/\*[0-9*#]+#/);
  if (match) {
    ussdCode = match[0];
  }

  return {
    ussdCode,
    reference: params.reference,
    id: chargeData.data.id,
  };
}

// ─── OPay uses the Flutterwave v2 Orchestrator API ───────────────────────────
const FLW_V2_BASE = "https://api.flutterwave.com";

/**
 * Creates or retrieves a Flutterwave customer for OPay charges.
 */
async function createFlwCustomer(email: string, fullName: string, phone: string) {
  const [first = "DataPlug", ...lastParts] = (fullName || "").split(" ");
  const last = lastParts.join(" ") || "User";

  const response = await fetch(`${FLW_V2_BASE}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      email,
      name: { first, last },
      phone: { country_code: "234", number: phone.replace(/^\+?234|^0/, "") },
    }),
  });

  const data = (await response.json()) as any;
  if (!response.ok || data.status === "error") {
    console.error("FLW create customer error:", data);
    throw new Error(data.message || "Failed to create customer");
  }
  return data.data; // { id: "cus_..." }
}

/**
 * Initiates an OPay charge via Flutterwave's orchestrator.
 * Returns the redirect URL the user must visit to authorize.
 */
export async function initiateOPayCharge(params: {
  amount: number;
  email: string;
  fullName: string;
  phone: string;
  reference: string;
  redirectUrl: string;
}) {
  // Step 1: Create customer
  const customer = await createFlwCustomer(params.email, params.fullName, params.phone);

  // Step 2: Create OPay payment method
  const pmRes = await fetch(`${FLW_V2_BASE}/payment-methods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({ type: "opay" }),
  });
  const pmData = (await pmRes.json()) as any;
  if (!pmRes.ok || pmData.status === "error") {
    console.error("FLW create payment method error:", pmData);
    throw new Error(pmData.message || "Failed to create OPay payment method");
  }
  const paymentMethodId = pmData.data.id;

  // Step 3: Create charge
  const chargeRes = await fetch(`${FLW_V2_BASE}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      customer_id: customer.id,
      payment_method_id: paymentMethodId,
      amount: params.amount,
      currency: "NGN",
      reference: params.reference,
      redirect_url: params.redirectUrl,
    }),
  });
  const chargeData = (await chargeRes.json()) as any;
  if (!chargeRes.ok || chargeData.status === "error") {
    console.error("FLW OPay charge error:", chargeData);
    throw new Error(chargeData.message || "Failed to initiate OPay charge");
  }

  const redirectUrl = chargeData.data?.next_action?.redirect_url?.url;
  if (!redirectUrl) {
    throw new Error("OPay redirect URL not returned");
  }

  return {
    chargeId: chargeData.data.id,
    redirectUrl,
    reference: params.reference,
  };
}
