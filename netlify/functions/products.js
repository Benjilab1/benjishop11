// netlify/functions/products.js
// VERSION SIMPLE DE TEST
// Elle renvoie toujours une liste vide, sans dépendance externe.

exports.handler = async (event) => {
  // On n'accepte que GET
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ok: false,
        error: "METHOD_NOT_ALLOWED"
      })
    };
  }

  // Réponse de test : pas d'accès aux Blobs, rien qui puisse planter
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      ok: true,
      items: []
    })
  };
};
