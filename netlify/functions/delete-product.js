const { Blobs } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { id } = JSON.parse(event.body || "{}");

  if (!id) {
    return { statusCode: 400, body: "Missing product ID" };
  }

  const store = Blobs.createStore("brainrot-products");

  await store.delete(id + ".json");

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
};
