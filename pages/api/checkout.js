// pages/api/checkout.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, amount, meta } = req.body;

    // Default to empty object if no metadata
    const metadata = {
      type,
      ...meta,
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name:
                type === "membership"
                  ? "The Green Room Membership"
                  : type === "reservation"
                  ? "Cafe Reservation"
                  : type === "social-entry"
                  ? "Social After Dark Entry"
                  : "After Dark Order",
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata,
      success_url: `${req.headers.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancelled`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: err.message });
  }
}
