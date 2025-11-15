const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
  try {
    const store = getStore("brainrot-products");

    const list = await store.list();
    const keys = list.keys || [];

    const items = [];

    for (const entry of keys) {
      const key = typeof entry === "string" ? entry : entry.key;
      if (!key) continue;

      const value = await store.get(key, { type: "json" });
      if (value) items.push(value);
    }

    items.sort((a, b) => {
      const da = a?.createdAt || "";
      const db = b?.createdAt || "";
      return db.localeCompare(da);
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    };

  } catch (err) {
    console.error("Erreur:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "SERVER_ERROR" }),
    };
  }
};
