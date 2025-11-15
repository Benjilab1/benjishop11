// netlify/functions/admin-products.js
// CRUD admin pour les BrainRot (Netlify Blobs + Busboy)

const Busboy = require("busboy");
const { getStore } = require("@netlify/blobs");

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

async function loadItems(store) {
  return (await store.get("items.json", { type: "json" })) || [];
}

async function saveItems(store, items) {
  await store.set("items.json", items, { type: "json" });
}

exports.handler = async (event) => {
  const store = getStore("benjishop-products");
  const url = new URL(event.rawUrl);
  const action = url.searchParams.get("action") || "create";

  // ---- LISTE POUR L'ADMIN ----
  if (event.httpMethod === "GET") {
    try {
      const items = await loadItems(store);
      return {
        statusCode: 200,
        headers: JSON_HEADERS,
        body: JSON.stringify({ items })
      };
    } catch (err) {
      console.error("GET admin-products error", err);
      return {
        statusCode: 500,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: "Erreur serveur (admin GET)" })
      };
    }
  }

  // ---- SUPPRESSION ----
  if (event.httpMethod === "POST" && action === "delete") {
    const id = url.searchParams.get("id");
    if (!id) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: "id manquant" })
      };
    }

    try {
      let items = await loadItems(store);
      const before = items.length;
      items = items.filter((p) => p.id !== id);
      await saveItems(store, items);

      return {
        statusCode: 200,
        headers: JSON_HEADERS,
        body: JSON.stringify({
          success: true,
          removed: before - items.length
        })
      };
    } catch (err) {
      console.error("DELETE admin-products error", err);
      return {
        statusCode: 500,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: "Erreur serveur (admin delete)" })
      };
    }
  }

  // ---- CREATION (FORM-DATA + BUSBOY) ----
  if (event.httpMethod === "POST" && action === "create") {
    return new Promise((resolve) => {
      const busboy = Busboy({
        headers: event.headers
      });

      const fields = {
        name: "",
        category: "",
        price: ""
      };

      busboy.on("field", (name, value) => {
        if (typeof value === "string" && value.length <= 500) {
          fields[name] = value.trim();
        }
      });

      // on ignore l'image, on vide juste le flux pour ne pas planter
      busboy.on("file", (_name, file, _info) => {
        file.resume();
      });

      busboy.on("finish", async () => {
        const { name, category, price } = fields;

        if (!name || !category || !price) {
          return resolve({
            statusCode: 400,
            headers: JSON_HEADERS,
            body: JSON.stringify({
              error: "Champs manquants (name, category, price)"
            })
          });
        }

        try {
          const items = await loadItems(store);

          const newItem = {
            id: Date.now().toString(),
            title: name,
            category,
            price_eur: Number(price),
            image: null // pour l'instant, on affiche l'image du perso côté front
          };

          items.push(newItem);
          await saveItems(store, items);

          return resolve({
            statusCode: 200,
            headers: JSON_HEADERS,
            body: JSON.stringify({ success: true, item: newItem })
          });
        } catch (err) {
          console.error("CREATE admin-products error", err);
          return resolve({
            statusCode: 500,
            headers: JSON_HEADERS,
            body: JSON.stringify({ error: "Erreur serveur (admin create)" })
          });
        }
      });

      const body = event.isBase64Encoded
        ? Buffer.from(event.body, "base64")
        : Buffer.from(event.body || "", "utf8");

      busboy.end(body);
    });
  }

  return {
    statusCode: 405,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: "Méthode ou action non supportée" })
  };
};
