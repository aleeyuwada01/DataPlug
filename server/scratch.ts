import "dotenv/config";

const SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || "";
const baseUrl = "https://api.flutterwave.com/v3";

async function test() {
  const response = await fetch(`${baseUrl}/virtual-account-numbers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      email: "teststatic@dataplug.app",
      is_permanent: true,
      bvn: "12345678901",
      tx_ref: "static-" + Date.now(),
      phonenumber: "08012345678",
      firstname: "Test",
      lastname: "User",
      narration: "DataPlug Wallet",
    }),
  });

  const data = await response.json();
  console.log("Response:", response.status, JSON.stringify(data, null, 2));
}

test();
