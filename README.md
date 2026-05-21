# PayPal Checkout

Custom on-site checkout page using PayPal Expanded Checkout (card fields + PayPal button).

## Setup

1. Deploy to Vercel.
2. Set environment variables in Vercel:
   - `PAYPAL_CLIENT_ID` — from PayPal Developer Dashboard
   - `PAYPAL_CLIENT_SECRET` — from PayPal Developer Dashboard
   - `PAYPAL_ENV` — `sandbox` for testing, `live` for production
3. In `public/index.html`, replace `YOUR_CLIENT_ID` in the PayPal SDK script tag with your Client ID.

## Structure

- `public/index.html` — the checkout page (frontend)
- `api/orders.js` — creates a PayPal order
- `api/orders/[orderId]/capture.js` — captures payment after approval
