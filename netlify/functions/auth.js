// netlify/functions/auth.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405 };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: "INVALID_JSON" }),
    };
  }

  const pass = body.password || "";
  const secret = process.env.ADMIN_PASSWORD || "";

  if (pass && secret && pass === secret) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } else {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: false }),
    };
  }
};
