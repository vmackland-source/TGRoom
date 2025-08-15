
import Stripe from 'stripe';
import prisma from '../../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { purpose, amount, meta } = req.body || {};
  if (!purpose || !amount) return res.status(400).json({error:'Missing purpose/amount'});
  if (!process.env.NEXT_PUBLIC_SITE_URL) return res.status(500).json({error:'Missing NEXT_PUBLIC_SITE_URL'});

  if (!process.env.STRIPE_SECRET_KEY) {
    // Dev fallback: pretend checkout by redirecting back
    return res.json({ url: process.env.NEXT_PUBLIC_SITE_URL + '/?paid=1' });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: purpose.toUpperCase() },
        unit_amount: amount
      },
      quantity: 1
    }],
    success_url: process.env.NEXT_PUBLIC_SITE_URL + '/?success=1',
    cancel_url: process.env.NEXT_PUBLIC_SITE_URL + '/?canceled=1',
    metadata: { purpose, ...(meta||{}) }
  });

  // store payment record
  await prisma.payment.create({
    data: {
      purpose, amount, status: 'created', stripeSession: session.id
    }
  });

  res.json({ url: session.url });
}
