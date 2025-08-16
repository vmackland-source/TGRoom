// pages/api/stripe/webhook.js
import Stripe from "stripe";
import sgMail from "@sendgrid/mail";
import twilio from "twilio";

// Stripe needs the raw body to verify the signature
export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sms = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// read raw body helper
function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  let event;
  try {
    const sig = req.headers["stripe-signature"];
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const amount = (session.amount_total || 0) / 100;
      const meta = session.metadata || {};
      const kind = meta.type || "order";

      // common contacts (we used these in your front-end)
      const contactEmail = meta.contactEmail || meta.email || "";
      const contactPhone = (meta.contactPhone || "").replace(/[^\d+]/g, "");

      // defaults (will be overridden per flow)
      let subject = "Payment received";
      let html = `<p>We received your payment of $${amount.toFixed(2)}.</p>`;
      let smsText = `Thanks! Payment received: $${amount.toFixed(2)}.`;

      if (kind === "reservation") {
        subject = "Your Cafe Reservation is Confirmed";
        html = `
          <h2>Reservation Confirmed</h2>
          <p><strong>Date:</strong> ${meta.date}<br/>
             <strong>Time:</strong> ${meta.time}<br/>
             <strong>Party:</strong> ${meta.partySize}${meta.isMember === "true" ? " (member discount applied)" : ""}</p>
          ${meta.policy ? `<p>${meta.policy}</p>` : ""}
          ${meta.notes ? `<pre style="white-space:pre-wrap;background:#111;padding:10px;border-radius:6px;color:#eee">${meta.notes}</pre>` : ""}
        `;
        smsText = `Reservation confirmed: ${meta.date} ${meta.time}, party ${meta.partySize}. Check email for details.`;
      }

      else if (kind === "social-entry") {
        // Put your real address/codeword logic here
        const address = "123 Secret Ave, Suite B";
        const codeword = "GreenLight";
        subject = "Social After Dark — Address & Codeword";
        html = `
          <h2>Entry Confirmed</h2>
          <p><strong>Address:</strong> ${address}<br/>
             <strong>Codeword:</strong> ${codeword}<br/>
             <strong>Hours:</strong> Friday & Saturday, 11 PM – 3 AM</p>
          <p>Have your QR code ready to be scanned. IDs checked on arrival. No outside food or drink. Zero tolerance for violence/theft/damage (permanent ban).</p>
          ${meta.qrSystemNote ? `<pre style="white-space:pre-wrap;background:#111;padding:10px;border-radius:6px;color:#eee">${meta.qrSystemNote}</pre>` : ""}
        `;
        smsText = `Social Entry confirmed. Address: ${address}. Codeword: ${codeword}. Hours Fri & Sat 11PM–3AM. Have your QR ready.`;
      }

      else if (kind === "after-dark-order") {
        subject = "Order Received — After Dark Menu";
        html = `
          <h2>Order Confirmed</h2>
          <p>Total: <strong>$${amount.toFixed(2)}</strong></p>
          ${meta.items ? `<pre style="white-space:pre-wrap;background:#111;padding:10px;border-radius:6px;color:#eee">${meta.items}</pre>` : ""}
          ${meta.policy ? `<p>${meta.policy}</p>` : ""}
        `;
        smsText = `Thanks! Your order was received. Total $${amount.toFixed(2)}. Check email for details.`;
      }

      else if (kind === "membership") {
        subject = "Membership Payment Received";
        html = `
          <h2>Membership Submitted</h2>
          <p>We received your membership details and payment. We’ll review your photo/ID match and issue your unique QR code (save it to your phone).</p>
        `;
        smsText = `Membership received. You’ll get your QR code shortly.`;
      }

      // Email customer
      if (contactEmail && process.env.SENDGRID_FROM_EMAIL) {
        await sgMail.send({
          to: contactEmail,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject,
          html,
        });
      }

      // SMS customer
      if (contactPhone && process.env.TWILIO_FROM_NUMBER) {
        await sms.messages.create({
          to: contactPhone,
          from: process.env.TWILIO_FROM_NUMBER,
          body: smsText,
        });
      }

      // Admin copy
      if (process.env.ADMIN_NOTIFY_EMAIL && process.env.SENDGRID_FROM_EMAIL) {
        await sgMail.send({
          to: process.env.ADMIN_NOTIFY_EMAIL,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: `[Admin] ${subject}`,
          html: `
            <p>Amount: $${amount.toFixed(2)}</p>
            <pre style="white-space:pre-wrap;background:#111;padding:10px;border-radius:6px;color:#eee">${JSON.stringify(meta, null, 2)}</pre>
          `,
        });
      }
    }

    return res.json({ received: true });
  } catch (e) {
    console.error("⚠️ Webhook handler error", e);
    return res.status(500).send("Webhook handler failed");
  }
}
