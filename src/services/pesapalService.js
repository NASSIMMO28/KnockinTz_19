const axios = require("axios");

const getToken = async () => {
  const BASE_URL = "https://pay.pesapal.com";
  const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
  const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

  const res = await axios.post(
    `${BASE_URL}/v3/api/Auth/RequestToken`,
    { consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET },
    { headers: { "Content-Type": "application/json", "Accept": "application/json" } }
  );

  if (res.data.status === "500") {
    throw new Error(`Pesapal auth error: ${res.data.error?.code}`);
  }
  return res.data.token;
};

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
      callback_url: `${process.env.FRONTEND_URL}/booking/callback`,
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

module.exports = { getToken, registerIPN, submitOrder, getTransactionStatus };