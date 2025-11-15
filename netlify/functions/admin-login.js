// netlify/functions/admin-login.js
// Vérifie un mot de passe en dur et renvoie ok / erreur.
// Aucune variable d'environnement nécessaire.

exports.handler = async (event) => {
  // On n'accepte que POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED" })
    };
  }

  // Mot de passe admin (tu peux le changer)
  const ADMIN_PASSWORD = "Noa051221"; // <-- c'est CE mot de passe qu'il faudra mettre sur /admin

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    body = {};
  }

  const input = (body.password || "").trim();

  if (input !== ADMIN_PASSWORD) {
    // mauvais mot de passe
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        success: false,
        error: "INVALID_PASSWORD"
      })
    };
  }

  // token bidon au cas où le front en veut un
  const token = "benjishop-admin";

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      success: true,
      token
    })
  };
};
