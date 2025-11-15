// netlify/functions/save-annonces.js
import { writeFileSync } from "fs";
import path from "path";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const filePath = path.join(process.cwd(), "annonces.json");

    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Erreur sauvegarde annonces:", err);
    return {
      statusCode: 500,
      body: "Erreur serveur",
    };
  }
}
