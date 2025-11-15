// netlify/functions/admin-login.js

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: "Méthode non autorisée" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const password = (body.password || "").trim();

    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
      console.error("[admin-login] ADMIN_PASSWORD manquant dans les variables Netlify.");
      return {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: "Configuration serveur manquante (ADMIN_PASSWORD).",
        }),
      };
    }

    if (password === expected) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true }),
      };
    }

    return {
      statusCode: 401,
      body: JSON.stringify({ ok: false, error: "Mot de passe incorrect." }),
    };
  } catch (err) {
    console.error("[admin-login] Erreur", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Erreur serveur." }),
    };
  }
};
