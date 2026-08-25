const axios = require("axios");

// ================================
// TOKEN CACHE
// ================================
let cachedToken = null;
let tokenExpiry = null;

const getToken = async () => {
  const now = Date.now();

  // ✅ return cached token if still valid (with 30s buffer)
  if (cachedToken && tokenExpiry && now < tokenExpiry - 30000) {
    console.log("Using cached Pesapal token");
    return cachedToken;
  }

  console.log("Fetching new Pesapal token...");

  const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
  const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

  const res = await axios.post(
    `https://pay.pesapal.com/v3/api/Auth/RequestToken`,
    { consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET },
    { headers: { "Content-Type": "application/json", "Accept": "application/json" } }
  );

  if (res.data.status === "500" || res.data.error) {
    throw new Error(`Pesapal auth error: ${res.data.error?.code}`);
  }

  // ✅ cache token for 5 minutes (300 seconds)
  cachedToken = res.data.token;
  tokenExpiry = now + (5 * 60 * 1000); // 5 minutes

  console.log("New Pesapal token cached, expires in 5 minutes");
  return cachedToken;
};

// ================================
// REGISTER IPN
// ================================
const registerIPN = async (token) => {
  const res = await axios.post(
    `https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN`,
    {
      url: `${process.env.BACKEND_URL}/api/payment/pesapal-webhook`,
      ipn_notification_type: "GET"
    },
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }
  );
  return res.data.ipn_id;
};

// ================================
// SUBMIT ORDER
// ================================
const submitOrder = async ({ bookingId, amount, email, phone, firstName, lastName }) => {
  const token = await getToken();
  const notificationId = process.env.PESAPAL_NOTIFICATION_ID;

  const res = await axios.post(
  `https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest`,
  {
    id: bookingId,
    currency: "TZS",
    amount,
    description: `Knockin Booking #${bookingId}`,
    callback_url: `${process.env.FRONTEND_URL}/booking/callback?bookingId=${bookingId}`,
    notification_id: notificationId,
    billing_address: {
      email_address: email,
      phone_number: phone,
      first_name: firstName,
      last_name: lastName
    }
  },
  {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  }
);
  return res.data;
};

// ================================
// GET TRANSACTION STATUS
// ================================
const getTransactionStatus = async (orderTrackingId) => {
  const token = await getToken();

  const res = await axios.get(
    `https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }
  );
  return res.data;
};

// ================================
// CLEAR CACHE (for testing)
// ================================
const clearTokenCache = () => {
  cachedToken = null;
  tokenExpiry = null;
  console.log("Pesapal token cache cleared");
};

module.exports = { getToken, registerIPN, submitOrder, getTransactionStatus, clearTokenCache };