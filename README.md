# Cardone’s Products — luxury botanical oils storefront

A mobile-responsive, Jamaica-first e-commerce storefront built with Next.js, TypeScript, CSS, Supabase order requests and real Cardone’s label artwork. **The storefront is ready for review, but payments are not enabled.**

## The catalogue

- Castor Oil — 5 fl oz / 148 mL, **J$1,800** (confirmed).
- Extra Virgin Coconut Oil — 5 fl oz / 148 mL, price not supplied.
- Extra Virgin Olive Oil — 2 fl oz / 60 mL and 5 fl oz / 148 mL, prices not supplied.
- Palm Oil — 5 fl oz / 148 mL, pending ingredient identification and price.
- Golden Jojoba Oil — 2 fl oz / 60 mL, price not supplied.
- Rosemary Oil — 2 fl oz / 60 mL, pending clarification whether essential oil or diluted infusion.
- Avocado Oil — an optional coming-soon item, listed without final label imagery.

**Every existing label artwork appears in the catalogue, regardless of price.** No invented prices or fabricated reviews. Prelaunch products cannot be submitted to checkout until you mark their variants `available: true` in `src/lib/catalog.ts`.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Check `npm run typecheck` and `npm run build` before launch. A GitHub Actions workflow also validates type-checking and builds on pushes to `main`.

## Enable real order requests

1. Create a Supabase project at https://supabase.com.
2. Run `supabase/migrations/001_orders.sql` in **SQL Editor**.
3. Put your Supabase project URL and **service role key** in your hosting environment as `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. **Never** put the service key in client-side code, commits or `NEXT_PUBLIC_` variables.
4. Deploy your repository to Vercel (Next.js preset). Add the same environment variables there.
5. Make a test order. Check `public.store_orders` in Supabase Table Editor. Confirm that the customer sees a reference number and the merchant can review the order.
6. Optionally connect Resend email notifications by setting `RESEND_API_KEY`, `ORDER_NOTIFICATION_EMAIL` and `ORDER_FROM_EMAIL` with a verified sending domain. Confirm emails arrive in tests.
7. Replace placeholder contact information and publish shipping/returns contact details before accepting paid orders.
8. Before public launch, add an anti-spam/rate-limiting solution to the order submission API and test notification failures. A saved order can succeed without an email notification.

The `/api/orders` endpoint validates customer input and re-checks products, quantities, availability and prices **on the server**. It stores orders in Supabase. A disabled backend returns a clear error and does not pretend the order succeeded. Delivery and final pricing must be confirmed manually before payment. Orders are not charged online.

## Change prices later

Edit `src/lib/catalog.ts`. Each variant has `priceJmd: number | null` and `available: boolean`.

- `priceJmd: null`: display "Price on request"; shoppers may add it to their quotation bag if `available: true`.
- `priceJmd: 2500`: display "J$2,500" and calculate this amount in the bag and on the server.
- `available: false`: visible as "Coming soon", but not orderable.

You do not need to rebuild the design when changing prices; redeploy after saving catalog changes. An admin dashboard and instant price changes without redeploy can be added in a later phase.

## Product artwork

The bottle mockup photographs in `public/images/*-bottle.webp` place the actual Cardone’s label designs onto illustrative amber glass bottles. Each product detail page has a **Glass bottle / Original label artwork** toggle; actual bottle photography may replace the mockups later. The files in `public/images/` use the actual Cardone’s designs produced for Castor, Extra Virgin Coconut, Extra Virgin Olive, Palm, Golden Jojoba and Rosemary Oil, plus the existing castor bottle mockup. **These bottle mockups are visual simulations, not photographs of production-filled inventory or certified regulatory-label artwork.** For physical printing, verify bottle dimensions, product identity (especially palm fruit versus palm kernel and rosemary essential versus infused), ingredients, contact details and applicable Jamaican rules. Do not publish unsubstantiated therapeutic claims. Do not imply independent purity certifications or customer reviews.

## Design and shopping features

Responsive pages, product variants, product explanations, a persistent cart, catalogue search, hair/skin filters, tasteful luxury imagery, FAQs and policies, quote requests, server-validated orders and optional merchant email. Shipping is Jamaica-only at launch, quoted separately. There is **no online credit card charging**, no fabricated reviews, and no unsupported fulfillment promises.

## Suggested launch checklist

- Decide whether to use a true payment gateway for JMD (merchant account and provider integration required).
- Confirm cash-on-delivery/pickup and delivery policies, contact methods, return policy and prices.
- Verify product ingredients, expiry/batch labeling and cosmetic claims.
- Add actual bottle photography and test checkout on phones.
- Configure a custom domain and professional email.
- Keep the Supabase key private and enable backup/notification monitoring.

_Designed for Cardone’s Products, packaged in St. Elizabeth, Jamaica._