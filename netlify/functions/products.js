// netlify/functions/products.js
// Retourne la liste de tous les BrainRot stockés dans Netlify Blobs
// (store "brainrot-products")

const { getStore } = require("@netlify/blobs");

/**
 * GET /.netlify/functions/products
 * Réponse : { ok: true, items: [...] }
 */
exports.handler = async (event) => {
  // On n’accepte que GET
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ok: false,
        error: "METHOD_NOT_ALLOWED",
      }),
    };
  }

  try {
    // Récupération du store Netlify Blobs
    const store = getStore("brainrot-products");

    // Liste des blobs existants
    const listing = await store.list();
    const blobs = Array.isArray(listing.blobs) ? listing.blobs : [];

    const items = [];

    // Pour chaque clé, on récupère le JSON
    for (const blob of blobs) {
      const key = blob.key;
      if (!key) continue;

      const value = await store.get(key, { type: "json" }).catch(() => null);
      if (value) {
        items.push(value);
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // (pas vraiment nécessaire vu que l’admin est sur le même domaine,
        // mais ça ne fait pas de mal)
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        ok: true,
        items,
      }),
    };
  } catch (err) {
    console.error("Erreur dans la fonction products:", err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: "SERVER_ERROR",
      }),
    };
  }
};
