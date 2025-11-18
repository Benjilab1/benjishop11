// netlify/functions/orders.js
const { getStore } = require('@netlify/blobs');

const { Blobs } = require("@netlify/blobs");

const blobs = new Blobs({
  siteID: process.env.NETLIFY_BLOBS_SITEID,
  token: process.env.NETLIFY_BLOBS_TOKEN
});

function getStore(name) {
  return blobs.getStore(name);
}

function json(status, body, extraHeaders={}) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}
const ok  = (b,h) => json(200,b,h);
const bad = (s,m) => json(s,{ error: m });

function euro(n){ return Number(n||0); }

async function listAllOrders() {
  const keys = await ORDERS.list();
  const out = [];
  for (const k of keys.blobs||[]) {
    const o = await ORDERS.get(k.key, { type: 'json' });
    if (o) out.push(o);
  }
  out.sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0));
  return out;
}

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;
    const q = event.queryStringParameters || {};
    const adminHeader = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];
    const isAdmin = !!adminHeader && adminHeader === process.env.ADMIN_PASSWORD;

    // ------ GET ------
    if (method === 'GET') {
      const user = (q.user || '').trim();

      // Admin: GET all if no user filter
      if (!user && isAdmin) {
        const all = await listAllOrders();
        return ok({ items: all, totalCount: all.length, totalSpent: all.reduce((s,o)=>s+euro(o.total_eur),0) });
      }

      if (!user) return bad(400, 'Missing user');

      const all = await listAllOrders();
      const mine = all.filter(o => String(o.userId||'').toLowerCase() === user.toLowerCase());
      const totalSpent = mine.reduce((s,o)=> s + euro(o.total_eur), 0);
      return ok({ items: mine, totalCount: mine.length, totalSpent });
    }

    // ------ POST (create) ------
    if (method === 'POST') {
      const data = JSON.parse(event.body || '{}');
      if (!data.userId || !Array.isArray(data.items) || !data.items.length) {
        return bad(400, 'Missing order data (userId, items)');
      }
      const id = data.id || `ord_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
      const now = new Date().toISOString();

      const order = {
        id,
        userId: String(data.userId).trim(),
        items: data.items.map(x => ({
          productId: x.productId || null,
          title: x.title || 'Item',
          price_eur: euro(x.price_eur),
          category: x.category || null
        })),
        total_eur: euro(data.total_eur || data.items.reduce((s,x)=>s+euro(x.price_eur), 0)),
        status: (data.status || 'pending'),
        txId: data.txId || null,
        createdAt: now,
        updatedAt: now
      };

      await ORDERS.setJSON(id, order);
      return ok({ ok: true, id });
    }

    // ------ PATCH (update status) ------
    if (method === 'PATCH') {
      if (!isAdmin) return bad(401, 'Unauthorized');
      const id = (q.id || '').trim();
      if (!id) return bad(400, 'Missing id');

      const cur = await ORDERS.get(id, { type: 'json' });
      if (!cur) return bad(404, 'Order not found');

      const data = JSON.parse(event.body || '{}');
      if (data.status) cur.status = String(data.status);
      cur.updatedAt = new Date().toISOString();

      await ORDERS.setJSON(id, cur);
      return ok({ ok: true, id, status: cur.status });
    }

    return bad(405, 'Method Not Allowed');
  } catch (e) {
    console.error('orders error:', e);
    return bad(500, 'Server error');
  }
};
