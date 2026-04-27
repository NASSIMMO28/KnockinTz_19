const axios = require("axios");

const BASE_URL = process.env.PESAPAL_BASE_URL;
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

// ================================
// GET ACCESS TOKEN
// ================================
const getToken = async () => {
  const res = await axios.post(
    `${BASE_URL}/api/Auth/RequestToken`,
    {
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }
  );

  // ✅ check for error in response
  if (res.data.status === "500") {
    throw new Error(`Pesapal auth error: ${res.data.error?.code}`);
  }

  return res.data.token;
};

// ================================
// REGISTER IPN
// ================================
const registerIPN = async (token) => {
  const res = await axios.post(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
    url: `${process.env.BACKEND_URL}/api/payment/pesapal-webhook`,
    ipn_notification_type: "GET"
  }, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  });
  return res.data.ipn_id;
};

// ================================
// SUBMIT ORDER
// ================================
const submitOrder = async ({ bookingId, amount, email, phone, firstName, lastName }) => {
  const token = await getToken();

  const notificationId = process.env.PESAPAL_NOTIFICATION_ID;

  const res = await axios.post(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    id: bookingId,
    currency: "TZS",
    amount,
    description: `Knockin Booking #${bookingId}`,
    callback_url: `${process.env.FRONTEND_URL}/booking/callback`,
    notification_id: notificationId,
    billing_address: {
      email_address: email,
      phone_number: phone,
      first_name: firstName,
      last_name: lastName
    }
  }, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  });

  return res.data;
};

// ================================
// GET TRANSACTION STATUS
// ================================
const getTransactionStatus = async (orderTrackingId) => {
  const token = await getToken();

  const res = await axios.get(
    `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
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

module.exports = { getToken, registerIPN, submitOrder, getTransactionStatus };