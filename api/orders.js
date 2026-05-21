// POST /api/orders
// Body: { productId, shippingId, customer: { email, firstName, lastName, address, city, state, zip } }
// Creates a PayPal order using server-side trusted prices.

import { getProduct, getShipping } from './_products.js';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, shippingId, customer } = req.body || {};

    const product = getProduct(productId);
    if (!product) return res.status(400).json({ error: 'Invalid product' });

    const shipping = getShipping(shippingId);
    const subtotal = product.price;
    const shippingCost = shipping.price;
    const total = (subtotal + shippingCost).toFixed(2);

    const token = await getAccessToken();

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: total,
          breakdown: {
            item_total: { currency_code: 'USD', value: subtotal.toFixed(2) },
            shipping:   { currency_code: 'USD', value: shippingCost.toFixed(2) }
          }
        },
        items: [{
          name: product.name,
          quantity: '1',
          unit_amount: { currency_code: 'USD', value: subtotal.toFixed(2) },
          category: 'PHYSICAL_GOODS'
        }],
        custom_id: productId,
        description: `${product.name} — ${shipping.label}`
      }]
    };

    if (customer && customer.address) {
      orderPayload.purchase_units[0].shipping = {
        name: {
          full_name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
        },
        address: {
          address_line_1: customer.address,
          admin_area_2: customer.city,
          admin_area_1: customer.state,
          postal_code: customer.zip,
          country_code: 'US'
        }
      };
    }

    const response = await fetch(`${BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}
