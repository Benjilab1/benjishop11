// netlify/functions/products.js
// Lit les BrainRot stockés dans le store "brainrot-products" (Netlify Blobs)
// et renvoie la liste au frontend. En cas d'erreur, on renvoie quand même 200
// pour éviter les 500 dans la console, mais avec ok:false.

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  // On ne prend que GET
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        ok: false,
        error: "METHOD_NOT_ALLOWED",
      }),
    };
  }

  try {
    const store = getStore("brainrot-products");

    // Liste des blobs
    const { blobs } = await store.list();
    const items = [];

    for (const blob of blobs) {
      try {
        const raw = await store.get(blob.key, { type: "text" });
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        items.push(parsed);
      } catch (err) {
        console.error("Erreur en lisant un blob:", blob.key, err);
        // si un blob est cassé, on l'ignore mais on continue les autres
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        ok: true,
        items,
      }),
    };
  } catch (err) {
    console.error("Erreur products():", err);
    // IMPORTANT : on renvoie 200 pour éviter les 500,
    // mais on signale l'erreur dans le JSON.
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        ok: false,
        error: "SERVER_ERROR",
        message: String(err),
        items: [],
      }),
    };
  }
};
