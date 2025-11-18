// netlify/functions/products.js
// Renvoie toute la liste des BrainRot stockés dans Netlify Blobs.

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED" }),
    };
  }

  try {
    const store = getStore("brainrot-products");
    const list = await store.list();

    const items = [];
    for (const blob of list.blobs) {
      const raw = await store.get(blob.key);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        items.push(obj);
      } catch (e) {
        console.warn("JSON invalide pour la clé", blob.key);
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, items }),
    };
  } catch (err) {
    console.error("Erreur products:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "SERVER_ERROR" }),
    };
  }
};
