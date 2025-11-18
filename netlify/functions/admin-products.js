// netlify/functions/admin-products.js
// Reçoit un JSON { name, category, price, image (data URL) }
// et stocke le BrainRot dans Netlify Blobs.

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    console.error("JSON parse error:", err);
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: "INVALID_JSON",
        message: "Corps JSON invalide.",
      }),
    };
  }

  const name = (body.name || "").trim();
  const category = (body.category || "").trim();
  const priceRaw = (body.price || "").toString().trim();
  const image = body.image || "";

  if (!name || !category || !priceRaw || !image) {
    console.warn("Champs manquants:", { name, category, priceRaw, hasImage: !!image });
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: "MISSING_FIELDS",
        message: "Champs manquants (name, category, price, image).",
      }),
    };
  }

  const priceValue = parseFloat(priceRaw.replace(",", "."));
  if (Number.isNaN(priceValue)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: "INVALID_PRICE",
        message: "Prix invalide.",
      }),
    };
  }

  try {
    const store = getStore("brainrot-products");

    const id =
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

    const item = {
      id,
      title: name,
      category,
      price_eur: priceValue,
      image, // data URL envoyée par le front
      createdAt: new Date().toISOString(),
    };

    await store.set(id, JSON.stringify(item), {
      metadata: { category, title: name },
    });

    console.log("BrainRot enregistré:", item);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, success: true, item }),
    };
  } catch (err) {
    console.error("Erreur admin-products:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "SERVER_ERROR" }),
    };
  }
};
