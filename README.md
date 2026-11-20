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

## Advanced owner dashboard and commerce backend (2026 upgrade)

The repository now includes `/admin`, Supabase-authenticated owner APIs, a fully editable catalogue, merchant contact settings, COD/bank/WhatsApp toggles, private receipt upload and review, product image upload, order statuses and an audit trail. These require a production Next.js server and are **deliberately inactive on the static GitHub Pages preview**.

### Before activating the production storefront

1. Use a commercial Next.js host and create a Supabase project. Run SQL migrations `001_orders.sql` and `002_store_management.sql` in order. Keep the `store_orders`, `store_settings`, `store_products`, `store_variants`, `store_admin_audit`, and `store_request_limits` tables private; the migrations enable RLS with no client access.
2. Create one Supabase Auth user for the store owner through a secure invitation or account process. Copy that user's **UUID** (not the email) into `ADMIN_USER_IDS`. The dashboard never auto-creates an admin. Enable appropriate MFA and secure password settings in Supabase Auth.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser login, plus `SUPABASE_SERVICE_ROLE_KEY` **on the server only**. The service-role key must never appear in client source, GitHub commits, public scripts, or `NEXT_PUBLIC_*` variables.
4. Set `RATE_LIMIT_SECRET` to a unique random secret. Confirm your hosting provider forwards a trustworthy client IP header; behind an untrusted proxy, IP-header rate-limiting should be replaced with a trusted platform limiter (and CAPTCHA for checkout). The built-in table limiter is basic, not a guarantee against distributed abuse.
5. Sign in at `/admin`, open **Products**, and click **Import seven existing Cardone’s products** exactly once. Existing descriptions, images and prices are preserved. Edit variants and mark them available only once they are genuinely ready. Contact and payment details remain blank until you provide them.
6. In **Settings**, add your own business telephone, WhatsApp, email, bank information (if applicable), delivery policies and enabled payment methods. Changes to bank information are recorded in the administrative audit log. Enabling a bank method exposes the **customer-facing** payment fields to shoppers, not the private admin account. Never store login credentials, PINs, or online-banking passwords.
7. Run a real end-to-end test with a test customer and order. Check the order is recorded, email notifications (if configured), cash/transfer/WhatsApp methods, private receipt review, and manual verification. A receipt upload automatically marks an order as **payment submitted**, *never verified*.
8. Review legal/regulatory label claims, confirmed stocks, Jamaica delivery fees, business privacy policies and commercial-host subscription before enabling real transactions.

### Operational cautions

- Product changes are stored in Supabase and fetched by `/api/catalog` without editing GitHub. The GitHub Pages demo intentionally uses the checked-in catalogue snapshot.
- Newly created products can be viewed on production dynamic Next.js product pages, while static preview routes cover the originally checked-in collection.
- Bank transfer details are shown only after the merchant enables them. No banking credentials are stored. The backend requires the owner’s signed Supabase session **and** an exact allowed user ID for any admin request.
- Receipt uploads are restricted to 5 MB JPEG, PNG, WebP or PDF, checked by file signature, and stored in a **private** bucket. Receipt review uses an authenticated, short-lived (60-second) signed link.
- Pricing is rechecked from the server catalogue before each order. The checkout refuses to claim successful payment; final order totals exclude unknown prices and unconﬁrmed delivery fees.
- Runtime secret configuration, actual order persistence, email delivery, merchant bank setup, and transaction acceptance **cannot be verified from the GitHub Pages static preview**.