// netlify/functions/products.js
// Liste tous les BrainRot stockés dans Netlify Blobs.

const { getStore } = require("@netlify/blobs");

// Utilise la config manuelle via les variables d'environnement
function getBrainrotStore() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;

  if (!siteID || !token) {
    throw new Error(
      "Missing blobs credentials: NETLIFY_BLOBS_SITE_ID or NETLIFY_BLOBS_TOKEN is not defined."
    );
  }

  // Configuration manuelle : plus besoin que Netlify active Blobs tout seul
  return getStore({
    name: "brainrot-products",
    siteID,
    token,
  });
}

exports.handler = async () => {
  try {
    const store = getBrainrotStore();

    // Liste des blobs
    const list = await store.list();
    const items = [];

    if (Array.isArray(list.blobs)) {
      for (const blob of list.blobs) {
        try {
          const value = await store.get(blob.key, { type: "json" });
          if (value) items.push(value);
        } catch (e) {
          console.error("Erreur lecture blob", blob.key, e);
        }
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        items,
      }),
    };
  } catch (err) {
    console.error("Erreur products.js :", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: "SERVER_ERROR",
        message: String(err && err.message ? err.message : err),
        items: [],
      }),
    };
  }
};
