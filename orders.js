// Vercel Serverless Function — /api/orders
//
// This replaces Firebase entirely. It runs on Vercel itself, on the exact
// same domain as the web page (yoursite.vercel.app/api/orders), so there
// is no separate external service to reach, no CORS, and no risk of an
// ISP/network blocking a third-party domain like firebaseio.com.
//
// Storage: Vercel KV (a Redis database you connect from the Vercel
// dashboard in ~1 minute, no separate account/signup needed — it's built
// into Vercel itself).
//
// GET  /api/orders         -> returns the full orders array as JSON
// PUT  /api/orders         -> body: full orders array, replaces everything
//
// Both reception, workers, and the manager all call this same endpoint,
// so everyone always sees the same shared data.

import { kv } from '@vercel/kv';

const ORDERS_KEY = 'tour_expert_orders';

export default async function handler(req, res) {
  // Basic CORS headers (harmless even though same-origin; helps if the
  // page is ever opened from a custom domain pointed at this project).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const orders = (await kv.get(ORDERS_KEY)) || [];
      res.status(200).json(orders);
      return;
    }

    if (req.method === 'PUT') {
      let body = req.body;
      // Some environments deliver the body as a raw string — parse defensively.
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      if (!Array.isArray(body)) {
        res.status(400).json({ error: 'Body must be a JSON array of orders.' });
        return;
      }
      await kv.set(ORDERS_KEY, body);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
}
