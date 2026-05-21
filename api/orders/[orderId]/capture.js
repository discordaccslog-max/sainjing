// POST /api/orders/[orderId]/capture
// Captures payment on an approved PayPal order, then emails the merchant with order details.

const BASE = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json();
  return data.access_token;
}

async function sendOrderEmail(orderDetails) {
  const { RESEND_API_KEY, MERCHANT_EMAIL, FROM_NAME, ORDERS_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !MERCHANT_EMAIL) {
    console.warn('Resend not configured — skipping email');
    return;
  }

  const fromAddress = ORDERS_FROM_EMAIL || 'onboarding@resend.dev';

  const {
    orderId, productName, amount, shippingMethod,
    customerName, customerEmail, shippingAddress
  } = orderDetails;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">🛒 New Order</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Order ID</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${orderId}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Product</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${productName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount Paid</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">$${amount}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Shipping</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${shippingMethod}</td></tr>
      </table>
      <h3 style="margin-top: 24px;">Customer</h3>
      <p style="line-height: 1.6;">
        <strong>${customerName}</strong><br>
        ${customerEmail}<br><br>
        ${shippingAddress.line1}<br>
        ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}
      </p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${FROM_NAME || 'Orders'} <${fromAddress}>`,
        to: [MERCHANT_EMAIL],
        subject: `🛒 New order — $${amount} — ${customerName}`,
        html
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend email failed:', err);
    }
  } catch (err) {
    console.error('Email send error:', err);
  }
}

async function sendCustomerConfirmation(customerEmail) {
  const { RESEND_API_KEY, FROM_NAME, ORDERS_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !customerEmail) return;

  const fromAddress = ORDERS_FROM_EMAIL || 'onboarding@resend.dev';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
      <div style="text-align: center; padding: 32px 0;">
        <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: #e8f5e9; color: #2e7d32; line-height: 56px; font-size: 28px; margin-bottom: 16px;">✓</div>
        <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 600;">Order confirmed</h1>
        <p style="margin: 0; color: #6b6b68; font-size: 15px; line-height: 1.5;">
          Thanks for your order. We've received your payment and will be in touch shortly.
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${FROM_NAME || 'Orders'} <${fromAddress}>`,
        to: [customerEmail],
        subject: 'Order confirmed',
        html
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Customer email failed:', err);
    }
  } catch (err) {
    console.error('Customer email error:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.query;
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

  try {
    const token = await getAccessToken();

    const response = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    // If capture succeeded, fire off the merchant email (don't block on it)
    if (data.status === 'COMPLETED') {
      const pu = data.purchase_units?.[0] || {};
      const capture = pu.payments?.captures?.[0] || {};
      const payer = data.payer || {};
      const shipping = pu.shipping || {};
      const addr = shipping.address || {};

      sendOrderEmail({
        orderId: data.id,
        productName: pu.description || 'Order',
        amount: capture.amount?.value || '?',
        shippingMethod: pu.description?.split(' — ')[1] || 'USPS',
        customerName: shipping.name?.full_name || `${payer.name?.given_name || ''} ${payer.name?.surname || ''}`.trim(),
        customerEmail: payer.email_address || 'unknown',
        shippingAddress: {
          line1: addr.address_line_1 || '',
          city: addr.admin_area_2 || '',
          state: addr.admin_area_1 || '',
          zip: addr.postal_code || ''
        }
      }).catch(err => console.error('Email bg error:', err));

      // Fire customer confirmation in parallel
      const buyerEmail = payer.email_address;
      if (buyerEmail) {
        sendCustomerConfirmation(buyerEmail).catch(err => console.error('Customer email bg error:', err));
      }
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Capture error:', err);
    return res.status(500).json({ error: 'Failed to capture payment' });
  }
}
