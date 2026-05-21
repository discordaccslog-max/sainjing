// GET /api/product?id=desert-small
// Returns product info and shipping options so the frontend can render the page.

import { PRODUCTS, SHIPPING_OPTIONS } from './_products.js';

export default function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing product id' });
  }

  const product = PRODUCTS[id];
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.status(200).json({
    id,
    name: product.name,
    price: product.price,
    image: product.image,
    planId: product.planId,
    shipping: SHIPPING_OPTIONS
  });
}
