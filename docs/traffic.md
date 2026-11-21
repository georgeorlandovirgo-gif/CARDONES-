# Private traffic reports

Owner → Traffic shows page views, approximate visits, popular pages and daily activity for 7, 30 or 90 days in Jamaica time. The existing owner allowlist and server-verified Supabase login protect the reporting endpoint. Database tables and RPCs deny anonymous and ordinary authenticated access.

Apply migration 005 after the existing migrations. On the production Next.js host set TRAFFIC_ENABLED=true, a separate random TRAFFIC_SECRET, and the canonical NEXT_PUBLIC_SITE_URL. Keep the secret server-only. Confirm collection and reports on that host before launch. GitHub Pages preview does not collect traffic or expose owner reports.

The browser uses a random sessionStorage identifier, renewed after 30 minutes without a page view. The server stores only its keyed hash, a deduplicated event ID, an allowlisted page path and the server timestamp. No raw IP, name, email, query string or referrer is stored. This is pseudonymous session counting, not a count of unique people. Separate tabs/devices may create separate sessions. DNT and Global Privacy Control are respected. Admin, checkout and API paths are excluded. Common bot user agents are ignored, but figures are approximate and can include undetected bots or miss blocked requests.

Each session is limited to 120 events per rolling day. Duplicate event IDs are ignored. Events older than 90 days are removed when new accepted events arrive; if tracking is disabled, schedule database deletion separately if strict retention is needed. Add hosting-level rate limits for /api/traffic before high-volume use; client-generated sessions are not an abuse-proof identity. Failures never prevent customers from browsing. No third-party analytics service is used.

Production acceptance: visit two public pages, check the owner report, confirm admin and checkout do not add views, then verify signed-out and non-owner accounts receive 403 from /api/admin/traffic. Live credentials were not available during implementation; these checks remain part of launch setup.
