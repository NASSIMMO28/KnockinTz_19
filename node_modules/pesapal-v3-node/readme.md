# Pesapal Node.js SDK

A production-ready **Node.js / TypeScript SDK** for integrating exclusively with the **Pesapal API 3.0**.

This SDK provides a clean, typed, and extensible interface for handling payments, IPN (Instant Payment Notifications), and transaction status—designed with modern best practices like retries, logging, and modular architecture.

---

## ✨ Features

- ✅ Full TypeScript support (typed requests & responses)
- 🔐 Built-in automatic authentication with **intelligent token caching**
- 🔁 Automatic retries with exponential backoff for transient failures
- 🛡️ **Client-side validation** for orders and IPNs (fail-fast)
- 🧾 Structured resources (Orders, IPN)
- 🔁 Recurring / subscription based payment orders
- ↩️ Refund request support
- 🚫 Order cancellation support
- 🔌 **IPN Security Utilities** (Signature verification & parsing)
- 🪵 Pluggable logging hooks
- 🌍 Sandbox & Live environment support
- 🧪 Comprehensive test suite and CI/CD ready
- 📃 JSDoc on all methods

---

## 🔐 Security Note

> [!WARNING]
> **NEVER** commit your `.env` file or hardcode live credentials in your source code. 
> Always use environment variables to store your `consumerKey` and `consumerSecret`.
> Ensure `.env` is included in your `.gitignore` file.

---

## 📦 Installation

```bash
npm install pesapal-v3-node
```

## Requirements

Node.js 18 or newer is required because the SDK uses the native `fetch` API.

---

## 🚀 Quick Start

```ts
import { Pesapal } from 'pesapal-v3-node';

const pesapal = new Pesapal({
  consumerKey: process.env.PESAPAL_CONSUMER_KEY!,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET!,
  environment: 'sandbox', // or 'live'
});

// 1. Register IPN URL (Optional if you already have an ipn_id)
const ipn = await pesapal.ipn.registerIPNUrl({
  url: 'https://your-app.com/ipn',
  ipn_notification_type: 'POST',
});

// 2. Submit an Order
const order = await pesapal.orders.submitOrder({
  id: 'ORDER-001',
  currency: 'UGX',
  amount: 100.00,
  description: 'Test payment',
  callback_url: 'https://your-app.com/callback',
  notification_id: ipn.ipn_id, // Use the ipn_id from step 1
  billing_address: {
    email_address: 'customer@example.com',
    phone_number: '0700000000',
    first_name: 'John',
    last_name: 'Doe',
  },
});

console.log('Redirect URL:', order.redirect_url);

// 3. Check Transaction Status
const status = await pesapal.orders.getStatus(order.order_tracking_id);
console.log('Status:', status.status);
```

---

## ⚙️ Configuration

```ts
const pesapal = new Pesapal({
  consumerKey: '...',
  consumerSecret: '...',
  environment: 'sandbox', // Default: sandbox
  retries: 3,            // Number of retries for transient failures (Default: 2)
  timeoutMs: 10000,      // Request timeout in milliseconds (Default: 10000)
  logger: console,       // Optional logger (debug, info, warn, error)
});
```

---

## 📚 API Reference

### Orders (`pesapal.orders`)

#### Submit Order
Initiates a transaction and returns a redirect URL. Includes client-side validation.
```ts
await pesapal.orders.submitOrder(payload: SubmitOrderRequest);
```

#### Get Transaction Status
Checks the status of a transaction using its tracking ID.
```ts
await pesapal.orders.getStatus(orderTrackingId: string);
```

---

### IPN (`pesapal.ipn`)

#### Register IPN URL
Registers a URL to receive Instant Payment Notifications. Returns an `ipn_id`.
```ts
await pesapal.ipn.registerIPNUrl({
  url: 'https://example.com/ipn',
  ipn_notification_type: 'POST',
});
```

### Recurring Payments (`pesapal.recurring`)

Recurring payments use Pesapal's standard `SubmitOrderRequest` endpoint with an
additional `account_number` field and optional `subscription_details`.

```ts
const subscriptionOrder = await pesapal.recurring.submitOrder({
  id: 'SUB-001',
  currency: 'UGX',
  amount: 100.00,
  description: 'Monthly subscription',
  callback_url: 'https://your-app.com/callback',
  notification_id: ipn.ipn_id,
  billing_address: {
    email_address: 'customer@example.com',
    phone_number: '0700000000',
    first_name: 'John',
    last_name: 'Doe',
  },
  account_number: 'ACC-001',
  subscription_details: {
    start_date: '01-06-2026',
    end_date: '01-06-2027',
    frequency: 'MONTHLY',
  },
});
```

`subscription_details` uses Pesapal's `dd-MM-yyyy` date format. Supported API
frequencies are `DAILY`, `WEEKLY`, `MONTHLY`, and `YEARLY`.

#### Handle IPN Webhooks (Security)
The SDK provides helpers to securely parse and verify IPN notifications from Pesapal.

```ts
import { verifyIPNSignature, parseIPN } from 'pesapal-v3-node';

// In your webhook controller (e.g., Express)
app.post('/ipn', (req, res) => {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-pesapal-signature']; // Placeholder header name
    
    // 1. Verify it came from Pesapal
    const isValid = verifyIPNSignature(signature, rawBody, process.env.PESAPAL_CONSUMER_SECRET);
    
    if (isValid) {
        // 2. Parse into a typed object
        const ipnData = parseIPN(req.body);
        console.log(`Update for Order: ${ipnData.OrderTrackingId}`);
    }
    
    res.sendStatus(200);
});
```

---

## 🔁 Retries & Performance

### Token Caching
The SDK automatically caches your authentication token and only requests a new one when the current one is near expiry. This eliminates unnecessary network round-trips.

### Automatic Retries
The SDK automatically retries requests that fail due to network issues, 5xx errors, or rate limiting (429).

### Recurring IPNs
Recurring payment notifications are sent to your registered IPN endpoint with
`OrderNotificationType` set to `RECURRING`. Use `orders.getStatus()` with the
received `OrderTrackingId` to fetch the transaction details.

### Refunds (`pesapal.refunds`)

Requests a refund for a completed payment using the confirmation code returned
by the transaction status endpoint.

```ts
const refund = await pesapal.refunds.requestRefund({
  confirmation_code: 'AA11BB22',
  amount: 100.00,
  username: 'John Doe',
  remarks: 'Service not offered',
});
```

Pesapal refund requests are subject to merchant approval. You cannot refund more
than the original payment amount, only completed payments can be refunded, and
Pesapal allows one refund request per payment.

### Order Cancellations (`pesapal.cancellations`)

Cancels a failed or pending order using the Pesapal order tracking ID returned
from the original submit order request.

```ts
const cancellation = await pesapal.cancellations.cancelOrder({
  order_tracking_id: order.order_tracking_id,
});
```

Pesapal only supports cancellation for failed or pending payments. A cancellation
request can only be submitted once, and processed payments cannot be cancelled.

### Normalised Errors
All errors are caught and thrown as `PesapalError`:
```ts
import { PesapalError } from 'pesapal-v3-node';

try {
  await pesapal.orders.submitOrder(payload);
} catch (err) {
  if (err instanceof PesapalError) {
    console.error(`Error: ${err.message} (Code: ${err.code}, Status: ${err.status})`);
  }
}
```

---

## 🧪 Development & Testing

Vitest loads `.env` before tests run. If `PESAPAL_CONSUMER_KEY` and
`PESAPAL_CONSUMER_SECRET` are present, the Pesapal sandbox smoke test will run
as part of `npm test`; otherwise it is skipped.

```bash
# Run tests
npm test

# Build project
npm run build

# Run full validation
npm run prepublishOnly
```

---

## 📁 Project Structure

```
src/
  index.ts        # Main entry point & IPN utilities
  client.ts       # Core HTTP client with Auth integration
  auth.ts         # Authentication logic & token caching
  orders.ts       # Order resource with validation
  recurring.ts    # Recurring payment resource with validation
  refunds.ts      # Refund request resource with validation
  cancellations.ts # Order cancellation resource with validation
  ipn.ts          # IPN resource with validation
  errors.ts       # Error normalization
  helpers/
    ipn.ts        # IPN signature verification & parsing
    retries.ts    # Retry logic
  types/
    types.ts      # TypeScript definitions
```

---

## 📄 License

MIT License
