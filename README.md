# Cardone’s Products

Next.js / TypeScript Jamaican botanical-oil storefront with a Supabase-backed owner dashboard. **The GitHub Pages site is a static demonstration, not a live order-taking service.** New database installations start paused.

## Develop and verify

Use Node.js 22 or newer (CI uses Node.js 24).

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run build:preview
npm run dev
```

`build:preview` creates an isolated static export in `out/`, with `/CARDONES-` as its base path, no API endpoints, a visible preview notice and a clearly labelled checkout simulation. It does not remove production API source. The main-branch workflows validate the production build and publish the static preview.

## Confirmed catalogue

Castor Oil, 5 fl oz / 148 mL, is J$1,800. Coconut, olive and jojoba have quotation-only prices until the owner supplies them. Palm and rosemary remain unavailable pending product verification. Avocado remains coming soon. Existing bottle sizes, labels and original artwork are preserved. No customer reviews, certifications or unconfirmed prices have been added.

The collection campaign, lifestyle image and oil-detail study are AI-generated illustrations. The original label artwork remains separately accessible on product pages. Illustrative bottle renders are not verified production packaging; the oil-study accessories are not included. Verify label claims and ingredients before commercial launch.

## Production configuration

1. Deploy this repository to a Next.js-compatible commercial host (for example, Vercel). GitHub Pages cannot run the backend.
2. Create a Supabase project. Run exactly these migrations, in order:
   - `supabase/migrations/001_orders.sql`
   - `supabase/migrations/002_store_management.sql`
   - `supabase/migrations/003_atomic_commerce.sql`
3. Configure the variables in `.env.example`. Keep `SUPABASE_SERVICE_ROLE_KEY` and `RATE_LIMIT_SECRET` server-only. Set `NEXT_PUBLIC_SITE_URL` to the production origin. Never commit credentials.
4. Create/invite the owner through Supabase Auth, then put the owner's exact Auth UUID in `ADMIN_USER_IDS`. Configure appropriate MFA/password protections in Supabase. The app does not grant owner access automatically.
5. Open `/admin`, sign in, and import the seven existing products. Import and each product save are transactional. Do not enable transactions before the catalogue is imported.
6. Enter merchant contact information, confirmed prices and availability, delivery parishes, delivery/pickup arrangements, policies and payment methods. Enter bank details yourself. A bank-detail change requires your current owner password and is saved with an atomic audit entry containing field names, not account numbers.
7. Validate real orders, notification delivery, private receipts, owner access and contact links on your configured host. Keep `store_paused` enabled until you approve launch readiness. Then explicitly uncheck “Temporarily pause orders”.

### Existing database installations

The repository previously contained two incompatible migrations named `002_*` and two disconnected dashboard implementations. The active, normalized `store_products` / `store_variants` schema is now the single supported architecture. The unused alternative is preserved as `docs/legacy/002_management.sql.disabled` for reference only. **Do not run it.** If a live database already used that alternative (integer `store_settings.id`, JSON `store_products.data`), back it up and migrate its data deliberately; do not run the canonical chain over it. No live database has been altered by this update.

## Owner operations

`/admin` provides business and WhatsApp contacts, bank-transfer details, editable policies, delivery parishes and fee, pickup instructions, temporary closure, image uploads, product variants/prices/stock/visibility/order, order filters/statuses, private receipt review and an audit history. Changes refresh the storefront when saved, on window focus, and every minute. Prices and availability are independently checked on each order request. Hidden or empty database catalogues no longer fall back to selling the checked-in products.

Contact links read the merchant settings. Checkout uses bank transfer only. Unpriced items require a quotation; they never produce a false payable total. A coming-soon or zero-stock variant cannot be added. Known delivery fees appear separately and are saved with the order; unknown fees remain unconfirmed. Customers see a persisted reference and item summary only after a successful database insert.

## Security and operational limits

- Owner APIs validate the signed Supabase session and exact `ADMIN_USER_IDS` allowlist on every request. RLS and revoked client grants prevent direct anonymous/authenticated table access. Service-role credentials never enter browser code.
- Settings, catalogue edits and order-status changes commit together with their audit log entries. Conflicting variant IDs cannot silently move another product's size.
- Receipts are limited to 5 MB and checked for JPEG/PNG/WebP/PDF signatures. They use a private storage bucket and 60-second owner-only review URLs. Uploading a receipt never verifies a payment. File signatures do not provide malware scanning; enable scanning at the host if required.
- Order attempts use an atomic six-per-hour hashed-IP limiter. Your host must provide a trusted `cf-connecting-ip` or sanitized `x-forwarded-for` header; do not expose the server behind an untrusted proxy. Configure platform request-body limits (about 5.3 MB) and abuse protection. Distributed abuse needs platform controls.
- Stock counts are checked at submission but are not an inventory reservation system. The merchant must confirm fulfilment; simultaneous requests do not reserve or decrement stock.
- The order list displays the newest 250 records. Summaries describe recorded completed-order values, not audited revenue or cleared funds.
- Optional Resend notifications use `RESEND_API_KEY`, `ORDER_NOTIFICATION_EMAIL`, and `ORDER_FROM_EMAIL`. A notification failure does not undo a saved order; check the dashboard and monitor the provider.
- No online card processing or automated payment settlement is implemented or claimed.

See [verification report](docs/VERIFICATION.md) for actual test results and deployment limits.

## Customer testimonials
Run `supabase/migrations/004_testimonials.sql` after migrations 001–003. The new `/testimonials` page accepts written stories and optional photos; the owner dashboard has a Testimonials review tab. See [testimonials setup](docs/testimonials.md). GitHub Pages remains a design preview with submissions disabled.

## Private traffic reports
Apply migration `005_traffic.sql` to enable the owner-only Traffic dashboard. See [traffic setup](docs/traffic.md) for activation, counting rules and privacy details.

## Delivery options
Apply `006_delivery.sql` and configure the Zip Mail prepaid postage amount in owner settings. See [delivery setup](docs/delivery.md) for free towns, courier COD, Tara destinations and Wednesday/Saturday dispatch safeguards.


## Invoice-first bank transfer checkout
Apply migrations 001–007 in numeric order, including `007_invoice_checkout.sql`, before using this checkout. No live database is changed by committing code.
Customers provide name, billing address, telephone and required email, choose delivery, and generate a printable invoice using server-checked prices. The invoice is saved as awaiting payment; bank details and the payable amount appear before transfer. Unpriced items cannot generate a payable invoice.
Customers keep the invoice page open, transfer through their bank, attach a JPG/PNG/WebP/PDF (maximum 5 MB) and bank transaction reference, then submit. A random access token is kept only on that page; only its SHA-256 hash is stored. Closing the page requires contacting the owner with the invoice reference. Proof is private, submissions are atomic and retry-safe, and uploading never verifies funds. The owner reviews the proof and verifies payment before processing. The dashboard distinguishes invoices awaiting customer submission.
The GitHub Pages preview generates a clearly marked, non-payable sample invoice locally and accepts no payment files or real orders. Production requires a server host, Supabase, all migrations and configured bank details. Invoice creation does not reserve stock. Automatic invoice emails and resuming an invoice after closing the page are not implemented.

## Payment safeguards
Apply migration 008 and configure Turnstile plus the trusted proxy header before opening live checkout. Both submission steps fail closed without the bot protection. Duplicate receipt/reference warnings, a mandatory owner bank-review form, unique bank credit allocation and audit records protect the payment workflow. See [payment safeguards and activation](docs/payment-safeguards.md), including PDF/OCR limitations and production checks. GitHub Pages remains a non-paying preview.
