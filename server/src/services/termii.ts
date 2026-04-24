import "dotenv/config";

const TERMII_BASE = "https://v3.api.termii.com/api";
const API_KEY = process.env.TERMII_API_KEY || "";
const SENDER_ID = process.env.TERMII_SENDER_ID || "DataPlug";
const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Sends an OTP to the given phone number via Termii.
 * In development mode, it skips the API call and logs the OTP to console.
 */
export async function sendOtp(phone: string, code: string): Promise<string> {
  if (IS_DEV || !API_KEY) {
    console.log(`\n  📱 [DEV OTP] Phone: ${phone} | Code: ${code}\n`);
    return `dev_pin_${Date.now()}`;
  }

  try {
    const response = await fetch(`${TERMII_BASE}/sms/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: API_KEY,
        message_type: "NUMERIC",
        to: phone.replace("+", ""),
        from: SENDER_ID,
        channel: "dnd",
        pin_attempts: 5,
        pin_time_to_live: 10,
        pin_length: 6,
        pin_placeholder: "< 1234 >",
        message_text: `Your DataPlug verification code is < 1234 >. Valid for 10 minutes.`,
        pin_type: "NUMERIC",
      }),
    });

    const data = (await response.json()) as any;
    if (data.pinId) {
      return data.pinId;
    }

    console.error("Termii send OTP response:", data);
    throw new Error(data.message || "Failed to send OTP via Termii");
  } catch (err) {
    console.error("Termii API error:", err);
    throw err;
  }
}

/**
 * Verifies an OTP via the Termii API.
 * In development mode, always returns true.
 */
export async function verifyOtp(pinId: string, pin: string): Promise<boolean> {
  if (IS_DEV || !API_KEY) {
    return true;
  }

  try {
    const response = await fetch(`${TERMII_BASE}/sms/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: API_KEY,
        pin_id: pinId,
        pin,
      }),
    });

    const data = (await response.json()) as any;
    return data.verified === "True" || data.verified === true;
  } catch (err) {
    console.error("Termii verify error:", err);
    return false;
  }
}
