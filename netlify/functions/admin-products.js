// netlify/functions/admin-products.js
// Reçoit un formulaire multipart (name, category, price, image)
// et stocke le BrainRot dans Netlify Blobs.

const Busboy = require("busboy");
const { getStore } = require("@netlify/blobs");

// Même helper que dans products.js
function getBrainrotStore() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;

  if (!siteID || !token) {
    throw new Error(
      "Missing blobs credentials: NETLIFY_BLOBS_SITE_ID or NETLIFY_BLOBS_TOKEN is not defined."
    );
  }

  return getStore({
    name: "brainrot-products",
    siteID,
    token,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED" }),
    };
  }

  return await new Promise((resolve, reject) => {
    const headers = event.headers || {};
    const contentType = headers["content-type"] || headers["Content-Type"];

    if (!contentType || !contentType.startsWith("multipart/form-data")) {
      resolve({
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "INVALID_CONTENT_TYPE",
          message: "Content-Type multipart/form-data requis.",
        }),
      });
      return;
    }

    const busboy = Busboy({ headers });

    const fields = {};
    let fileData = null;

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (fieldName, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];

      file.on("data", (data) => {
        chunks.push(data);
      });

      file.on("end", () => {
        fileData = {
          filename,
          mimeType,
          buffer: Buffer.concat(chunks),
        };
      });
    });

    busboy.on("error", (err) => {
      console.error("Busboy error:", err);
      reject(err);
    });

    busboy.on("finish", async () => {
      try {
        const name = (fields.name || "").trim();
        const category = (fields.category || "").trim();
        const price = (fields.price || "").trim();

        if (!name || !category || !price || !fileData) {
          console.warn("Champs manquants:", {
            name,
            category,
            price,
            hasFile: !!fileData,
          });
          resolve({
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ok: false,
              error: "MISSING_FIELDS",
              message: "Champs manquants (name, category, price, image).",
            }),
          });
          return;
        }

        const priceValue = parseFloat(price.replace(",", "."));
        if (Number.isNaN(priceValue)) {
          resolve({
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ok: false,
              error: "INVALID_PRICE",
              message: "Prix invalide.",
            }),
          });
          return;
        }

        const base64 = fileData.buffer.toString("base64");
        const dataUrl = `data:${fileData.mimeType};base64,${base64}`;

        const store = getBrainrotStore();

        const id =
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).slice(2, 8);

        const item = {
          id,
          title: name,
          category,
          price_eur: priceValue,
          image: dataUrl,
          createdAt: new Date().toISOString(),
        };

        await store.set(id, JSON.stringify(item), {
          metadata: {
            category,
            title: name,
          },
        });

        console.log("BrainRot enregistré:", item);

        resolve({
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ok: true,
            success: true,
            item,
          }),
        });
      } catch (err) {
        console.error("Erreur admin-products:", err);
        resolve({
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ok: false,
            error: "SERVER_ERROR",
            message: String(err && err.message ? err.message : err),
          }),
        });
      }
    });

    const encoding = event.isBase64Encoded ? "base64" : "binary";
    const body = event.body
      ? Buffer.from(event.body, encoding)
      : Buffer.alloc(0);
    busboy.end(body);
  });
};
