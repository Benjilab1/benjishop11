exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { password } = JSON.parse(event.body || "{}");
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "NO_ADMIN_PASSWORD",
      }),
    };
  }

  if (password === ADMIN_PASSWORD) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  }

  return {
    statusCode: 401,
    body: JSON.stringify({ ok: false, error: "BAD_PASSWORD" }),
  };
};
