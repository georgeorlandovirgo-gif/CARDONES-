# CARDONE’S PRODUCTS — Jamaican botanical oils

Premium, mobile-first storefront with the original six luxury oil labels, glass-bottle mockups, new editorial photography and an optional Avocado Oil coming-soon entry. The only confirmed price is **J$1,800 for 5 fl oz / 148 mL Castor Oil**. All other prices remain unconfirmed.

**Two distinct modes:**
- **GitHub Pages preview**: static site, responsive shopping bag, full collection, product pages, search, a simulated checkout and clearly disabled private management. NO real orders, customer details, receipt uploads or payments are accepted.
- **Production host with Next.js server and Supabase**: real order requests, configured bank transfer, cash on delivery, WhatsApp ordering, protected receipt storage and a genuine editable owner dashboard. This production service is NOT activated.

## Run locally

Requires Node 20+:

    npm ci
    cp .env.example .env.local
    npm run dev
    npm run typecheck
    npm run build

Open http://localhost:3000. With no Supabase configuration, this is a preview, not a live store.

## Owner dashboard: /admin

The authenticated owner can change prices, sizes, product information, availability, photos, featured products, product display order, contact details, WhatsApp number, social links, delivery instructions, policies, COD and bank-transfer status. The owner can add products and review real order requests, private transfer receipts and genuine recorded sales. Sensitive changes are audited. Bank-detail changes require fresh password confirmation; the audit log never includes the account number itself. Phone-friendly administration does not require editing source code.

There are NO preconfigured owner emails, credentials or bank details. GitHub Pages serves an informative disabled manager, not a working admin service.

## Activate the production store safely (do these steps only when ready)

1. Select a commercial Next.js host supporting Node-based API routes. GitHub Pages remains only a non-transactional design preview.
2. Create a Supabase project. In Supabase SQL Editor run **supabase/migrations/001_orders.sql**, followed by **supabase/migrations/002_management.sql**.
3. In Supabase **Authentication → Users**, create your own private login, verify its email and copy the resulting **Auth UUID**. Do not use your email address as the UUID.
4. In Supabase SQL Editor, grant this user access using the following sample. **Replace the all-zero UUID with your actual Auth UUID before execution**:

       INSERT INTO public.store_admins (user_id)
       VALUES ('00000000-0000-0000-0000-000000000000')
       ON CONFLICT (user_id) DO UPDATE SET active=true;

5. On the hosting provider, configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SITE_URL. Add a long random ORDER_RATE_SALT. **Never put the secret service-role key in public client code, GitHub commits or a NEXT_PUBLIC variable.**
6. Strongly recommended: configure Cloudflare Turnstile site key and secret for anti-spam protection, test both, then set NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY. When the secret exists, the server rejects orders lacking a valid verification token.
7. Deploy your main branch to the suitable commercial host. Check /api/health, /api/storefront and /admin. Log in as the approved owner.
8. Complete the verified contact details, bank account and WhatsApp number if applicable. Review and update delivery, returns and privacy details. Complete prices and stock. Confirm rosemary essential-vs-infused oil, palm-vs-palm-kernel oil, extra-virgin designations and cosmetic-use claims before sales.
9. Test a real order on the configured backend. Ensure it appears in /admin. Upload a test receipt to the PRIVATE store, inspect the time-limited owner-only viewing link, and check that payment is only marked Verified when the owner actually confirms cleared funds.
10. Enable the Accept real order requests setting only when all tests and merchant approvals are satisfactory.

## Payments and security

- No credit-card gateway is connected. Do not announce card processing.
- Bank details are shown only when the owner explicitly enables bank transfer. Changing bank details requires a password check and audited write.
- Cash-on-delivery/pickup and WhatsApp actions appear only if enabled and configured.
- The store validates price, quantity, variant availability and payment method on the server; items without a confirmed price use quotation processing.
- Receipts may be JPG, PNG, WebP or PDF (3MB maximum); they are private, never published as direct public file links. Uploading a receipt sets Payment Submitted, NOT Payment Verified.
- The owner must independently verify payments and confirm delivery. Public users cannot read order records or modify settings.
- A database-backed rate limit and honeypot apply to real order requests. Add Turnstile, a verified domain, HTTPS, a privacy-retention policy and monitoring for launch.
- The database stores orders; email notices are optional and require RESEND_API_KEY, ORDER_NOTIFICATION_EMAIL and ORDER_FROM_EMAIL with a verified sender.
- Editorial and bottle imagery are design illustrations, not verified inventory photos, medical claims, purity certificates or real customer endorsements.

## GitHub Pages preview

The GitHub workflow **.github/workflows/pages-demo.yml** uses static-export mode and removes server-only APIs in the CI workspace only. All production code remains in the repository. GitHub Pages checkout is simulated; the owner manager and personal data storage are intentionally disabled.

https://georgeorlandovirgo-gif.github.io/CARDONES-/

## Architecture

- src/lib/catalog.ts: seven accurate product entries, offline/demo fallback
- src/components/StoreProvider.tsx: persistent cart and live store settings
- src/app/checkout: preview and gated production order submission
- src/app/admin: responsive owner dashboard, with verified server-side authorisation
- src/app/api: protected admin, public catalogue, real orders and private receipts
- supabase/migrations: row-level security, store data, order throttling and atomic change auditing
- public/images: Cardone’s authentic label designs, staged glass renders, campaign and lifestyle photographs

Customers see confirmed prices in JMD; unpriced and coming-soon oils remain visible. Future product changes appear on production without changing GitHub code.

_Built for Cardone’s Products, packaged in St. Elizabeth, Jamaica._
