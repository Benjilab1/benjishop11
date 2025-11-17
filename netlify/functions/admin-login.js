export async function handler(event) {
  const { password } = JSON.parse(event.body);

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing ADMIN_PASSWORD on server" })
    };
  }

  if (password === ADMIN_PASSWORD) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }

  return {
    statusCode: 401,
    body: JSON.stringify({ error: "Mot de passe incorrect" })
  };
}
