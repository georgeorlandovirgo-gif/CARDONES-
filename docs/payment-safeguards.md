# Payment proof and false-order safeguards

## Implemented
- Cloudflare Turnstile on invoice generation and proof submission, verified on the server with exact hostname and action checks. Missing configuration, failed verification and provider outages fail closed. Tokens are also consumed once in the database to prevent concurrent replay.
- Atomic limits of six attempts per hour per configured proxy IP and endpoint scope. Invoice creation also limits normalized email and phone; proof uploads limit each authenticated invoice. Identifiers are HMAC-hashed in the counters. Shared networks can hit the same limit; customers may contact the store.
- Required bank-issued transaction ID. Matching normalized customer IDs or exact SHA-256 receipt bytes on other orders generate owner-only review warnings. Submission is serialized so concurrent reuse is detected. Retries of the same completed submission cannot replace the stored proof.
- Warnings do not prove fraud. A changed or recompressed image evades an exact-byte hash; banks can also use overlapping reference formats. The later submission carries the warning; previous orders are not retrospectively marked fraudulent.
- Maximum 5 MB uploads and capped streamed multipart requests. JPEG/PNG/WebP images must decode, are limited to 16 million pixels, reject animation, and are re-encoded without metadata. PDFs are signature-checked and stored privately; they are NOT decoded, sanitized or malware-scanned. Owner access uses a 60-second signed download, not an embedded public document. Keep a maintained PDF reader and endpoint protection; add a host-side malware scanner before accepting PDFs if required.
- No stock is reserved or shipment triggered by generating an invoice or uploading proof.
- All submitted payments remain unverified until the owner independently checks cleared funds in the receiving bank account. The bank-review form requires an actual bank credit ID, exact invoice amount (products plus prepaid postage), and explicit confirmation. Duplicate warnings require a review note.
- A normalized owner-recorded credit ID cannot be allocated to two orders. It remains allocated even if an order is cancelled; refunds, split transfers, overpayments and legitimate multiple-order payments require manual reconciliation. These cases are deliberately not silently approved.
- Verification and audit entries are atomic. Database guards block bypass through the normal status selector. Existing Wednesday/Saturday dispatch and prior verification requirements remain.
- Receipts, hashes, review notes and customer data remain private. Neither uploaded screenshots nor customer-entered transaction IDs are bank authentication.

## Activate on production
1. Apply migrations 001–008 in numeric order, including 008_payment_safeguards.sql. This code update does not alter a live database. Reconcile any previously verified invoice orders before migration, as older records have no bank-review fields.
2. Configure NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY and TURNSTILE_HOSTNAME (hostname only, no scheme/path). Restrict the widget to the production hostname. Test the actual hostname/action checks with production-domain keys; do not use test keys on the live store.
3. Set TRUSTED_CLIENT_IP_HEADER only to a header your host overwrites. Block direct origin access and strip spoofed forwarding headers. The application cannot establish proxy trust by itself.
4. Configure Supabase/service credentials, RATE_LIMIT_SECRET, bank details, HTTPS and private storage. Set host request-body/time limits, edge rate limits/WAF rules and spending/storage alerts. Application limits alone do not stop a distributed denial-of-service attack or all human-submitted false orders.
5. Run a controlled end-to-end test on the production host: invoice, valid bot check, private upload, duplicate warnings, bank review, blocked reused bank credit, and shipment gates. No real bank connection or automatic reconciliation is included.
6. Maintain backups and an agreed retention/deletion process for abandoned invoices and payment documents. Automatic expiry/deletion is not implemented; do not delete proof needed to resolve a genuine payment.

## Assessment of the supplied screenshots
The layered approach is useful. OCR can help compare text, but editable text and metadata cannot establish authenticity or cleared funds. Cropping is not evidence of fraud, and missing metadata is not evidence of authenticity. This implementation does not deploy OCR, EXIF-based fraud scoring, or AI receipt approval. Its final gate is the owner's independent bank reconciliation. Email/phone ownership verification and MFA are separate future controls, not claimed here.

References:
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
