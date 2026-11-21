# Customer stories

The Testimonials page is linked from the header, footer and homepage. Customers can submit a title, experience, product, public display name, private email and up to three optional photos with Before / After / My experience labels and captions. Both publication consent and photo permissions are required.

## Production activation

1. Deploy the Next.js server with the existing Supabase credentials, owner allowlist and trusted proxy IP configuration. Apply migrations 001–004 in order and import the catalogue through owner management.
2. Keep the `cardones-testimonials` bucket private. Migration 004 creates it. Uploaded JPG, PNG and WebP photos are decoded, bounded to 25 megapixels, resized and re-encoded as JPEG with metadata removed. Originals are not retained. Each input is limited to 5 MB; there are at most three. Ensure the hosting proxy supports request bodies of at least 16 MB, or lower the client and server limits together.
3. Set `TESTIMONIAL_SUBMISSIONS_ENABLED=true` and `RATE_LIMIT_SECRET` on the production host. The existing atomic rate limiter allows six submission attempts per IP per hour, independently of order attempts.
4. Test a real submission privately: confirm pending status, private storage and private email; approve through Owner → Testimonials; verify public display and homepage pop-up; hide it and confirm removal. Delete test data and uploaded objects afterwards. No live backend was available during implementation, so this deployment check remains required.

## Publication and pop-ups

Only approved stories are returned by the public endpoint. Public responses omit email and storage paths. Images use signed links valid for five minutes (owner review links: one minute; use Refresh to renew). Hiding a story stops new public responses; already downloaded content or signed links may persist until expiry. Use the dashboard to approve, reject or hide stories. Decisions are audited. Review relevance, authenticity and permission, not merely whether an experience is positive.

On the homepage, the first approved story appears after ten seconds, then the card rotates every twenty seconds. Rotation pauses while hovered, keyboard-focused or the tab is hidden. Closing it suppresses it for the visit using session storage. With no approved stories, no pop-ups appear. There are no sample testimonials or invented customer claims. GitHub Pages does not run the API, so submissions, moderation and real testimonial pop-ups require the production server.

Customers may request removal through Contact. Hide promptly; for permanent deletion, remove the row and its associated private storage objects using the Supabase owner tools. Do not export private emails into public content. Submitted photos and comments are personal experiences, not substantiation of product efficacy.
