// netlify/functions/products.js
// Retourne la liste des BrainRot en vente pour la page d'accueil

const { getStore } = require("@netlify/blobs");

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

  try {
    const store = getStore("benjishop-products");

    // On lit le tableau [{id,title,category,price_eur,image}, ...]
    const items = (await store.get("items.json", { type: "json" })) || [];

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ items })
    };
  } catch (err) {
    console.error("Erreur products.js", err);
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Erreur serveur (products)" })
    };
  }
};
