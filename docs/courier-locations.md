# Published courier collection locations

Checked 22 November 2026. These are maintained snapshots, not a live courier availability feed. Source links appear beside the checkout dropdown. Recheck before launch and periodically thereafter.

- Knutsford Express: 19 entries from https://www.knutsfordexpress.com/courier/courier-locations/ . Use this courier-specific list instead of the general passenger/contact list, which also includes Annotto Bay. Parish labels follow the courier list.
- Tara: five branch offices from https://taracan.com/contact/ and https://taracan.com/ . Branch collection service is described at https://taracan.com/services/branch-to-branch/ . Negril Aerodrome is listed in Hanover, distinct from the Cardone’s free Negril town drop-off in Westmoreland.
- Zip Mail: 104 entries in the PICK UP LOCATIONS column of https://jamaicapost.gov.jm/wp-content/uploads/2022/03/zip-Mail-locations.pdf . This is still the full location list linked by https://jamaicapost.gov.jm/zip-mail/ at review time. Do not substitute the 73 sender drop-off entries. The PDF is older, despite remaining officially linked; availability must be confirmed before dispatch. Its 'Fairy Hll' typo is displayed as Fairy Hill. Zip Mail source does not provide parishes, so no unsupported parish mapping was invented.

Customers choose one published location for the selected courier. The server checks membership in that courier’s list and stores the canonical location name with the order. Switching delivery services clears the selection. Tara home delivery keeps its town and full-address fields; free drop-off keeps its town and meeting-point fields. No migration is required for this dropdown update: migration 006 already stores the chosen destination. Existing orders are unchanged.

To update branches, edit src/lib/courier-locations.ts from the relevant official publication, update this review note and the tests, then deploy. No courier booking or real-time branch availability is implied.
