
# The Green Room — All‑in‑One App (MVP)

Dark, smoky, gold-accent UI. Features:
- Membership application ($60/year) with required photo link.
- Reservations ($80/person) with optional free guest (members only).
- After Hours food ordering with infusion add‑on (+$5) and dessert pre‑infused ($10).
- Pay in‑app via Stripe Checkout (test mode ready).
- Basic admin dashboard (view members, reservations, orders).

> **Legal note**: You are responsible for complying with your local laws. Enable age gates and only offer infusion where legal.

---

## 0) What you need
- A computer with Node.js >= 18: https://nodejs.org/
- (Optional) A free Stripe test account for payments: https://dashboard.stripe.com/register

## 1) Get this project running (local)
1. **Download** the zip and unzip it.
2. Open the folder in your terminal.
3. Run: `npm install`
4. Copy `.env.example` to `.env.local` and fill in the values. For local dev you can keep `STRIPE_SECRET_KEY` empty to simulate checkout.
5. Set up the database:  
   - `npx prisma generate`  
   - `npx prisma migrate dev --name init`
6. Start the app: `npm run dev`
7. Go to: `http://localhost:3000` in your browser.

## 2) Quick demo flow (no Stripe key)
- Apply for membership (give a real email you’ll reuse).
- Set your profile cannabis preference.
- Make a reservation (use that email).  
- Place a food order.  
- Notice checkout “pretends” success without a Stripe key.

## 3) Turn on real payments (Stripe)
1. In Stripe dashboard, get your **test secret key** (starts with `sk_test_...`).
2. Put it into `.env.local` as `STRIPE_SECRET_KEY`.
3. Set `NEXT_PUBLIC_SITE_URL` to your site URL (during dev: `http://localhost:3000`).
4. Restart `npm run dev`. Now payments open real test checkout. Use Stripe test cards like `4242 4242 4242 4242`.

> **Want PayPal too?** You can add PayPal later. Stripe-only keeps setup simple. I can add PayPal buttons in `/menu` and `/membership` pages on request.

## 4) Admin dashboard
- Open `http://localhost:3000/admin?key=YOUR_ADMIN_KEY`  
- Change `ADMIN_KEY` in `.env.local` to something only you know.
- You’ll see the latest 100 memberships, reservations and orders.

## 5) Deploy to the internet (easy way)
- Create a free Vercel account: https://vercel.com/
- Click “New Project” → “Import” → upload this folder or connect your repo.
- Add the same environment variables in Vercel → Project → Settings → Environment Variables.
- Vercel will build and give you a URL.
- (Optional) Turn on a custom domain.

## 6) How prices and rules are wired in
- Reservation price: **$80 per person** → in `pages/reservations.js` (look for `partySize * 8000`).
- Membership: **$60/year** → in `pages/membership.js` (`Pay $60 Membership`) and in `pages/api/checkout.js` via amount you pass.
- After Hours menu prices: `pages/menu.js` → `MENU` array.  
  - Infusion add‑on: +$5 per infusible item.
  - Dessert is always infused by default.
- Free guest flag is saved in reservation → `includesGuest` (admin can see it).

## 7) Dumbed‑down cheat sheet
- “**Install stuff**”: open folder in terminal → type `npm install` → press Enter.
- “**Start the website**”: type `npm run dev` → press Enter → open your browser at `http://localhost:3000`.
- “**Make DB**”: type `npx prisma migrate dev --name init` one time the first run.
- “**Admin**”: go to `/admin?key=WHATYOUSET`.
- “**Change prices**”: open the page file, find the number, edit, save, browser auto-refreshes.
- “**Make it live**”: sign up at Vercel → import project → set the same `.env.local` values in Vercel → deploy.

## 8) Next steps I can add if you want
- Real login (email or SMS) and member verification.
- Time‑slot inventory caps and seat maps.
- PayPal and Apple/Google Pay (Stripe handles those mostly).
- Upload photos instead of URLs (S3/Cloudinary).
- Age gate + e‑signature for terms.
- SMS confirmations and QR codes for door scans.
- Coupons for member discounts ($10 off café visits, $10 entry, $15 guest fee logic).
