import Stripe from "stripe";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { productName, price, tiktok } = JSON.parse(event.body);

    if (!productName || !price || !tiktok) {
      return { statusCode: 400, body: "Données manquantes" };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: productName },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: "https://benjishop.netlify.app/success.html",
      cancel_url: "https://benjishop.netlify.app/cancel.html",
      metadata: { tiktok, productName },
    });

    // Envoi dans ton salon Discord (catégorie VENTE)
    const webhookURL = process.env.DISCORD_WEBHOOK_URL;
    await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `💸 **Nouvelle commande sur Benji Shop !**
> 🧠 BrainRot : **${productName}**
> 💶 Prix : ${price} €
> 🎯 TikTok : ${tiktok}
> 🧾 Lien de paiement : ${session.url}`,
      }),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Erreur Stripe:", err);
    return { statusCode: 500, body: "Erreur serveur" };
  }
}
