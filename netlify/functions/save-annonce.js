const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body || "{}");

    // Récupère le store "annonces"
    const store = getStore("annonces-store");

    // On sauvegarde sous la clé "all"
    await store.set("all", JSON.stringify(data), {
      metadata: { updated: new Date().toISOString() }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (err) {
    console.error("Erreur save-annonce:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "SERVER_ERROR" }),
    };
  }
};
