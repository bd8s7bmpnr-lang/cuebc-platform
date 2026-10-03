# Frontend coverage and verification

The original 70 mockups are retained unchanged in `docs/design/`. Some represent states or tabs within one workflow, rather than separate standalone pages. The interactive app uses the same palette, logo, poster, typography, spacing, cards, sidebar, tables and responsive breakpoints.

| Mockups | Interactive routes / states |
| --- | --- |
| 01–03, 57–59 | `/`, `/program`, `/workshop/:id`; search, audience/topic/format/experience/time filters, saved workshops |
| 04–09 | `/register/info`, `/ticket`, `/workshops`, `/review`, `/payment` beneath `/register`; `/confirmation` |
| 10–12 | `/portal`, `/receipt`, `/edit/info`, `/edit/workshops`; PDF/print, email verification, ticket change request |
| 13–16, 70 | `/online` before/during conference, `/sign-in`, `/venue`, `/messages` |
| 17–20, 53–56, 60 | `/waitlist`, `/waitlist/:workshop`, `/waitlist-status/:id`, `/payment-status`, closed/full registration, `/cancel`, cancellation confirmation, `/policies` |
| 21–25, 65–69 | `/admin/library`, `/admin/create`, `/admin/dashboard`, `/admin/registrations`, `/admin/attendee/:id` and its edit/workshops/payment/communications/activity/notes sections |
| 26–29 | `/admin/program`, `/admin/workshop/:id`, `/admin/presenters`, `/admin/presenter/:id` |
| 30–32 | `/admin/waitlists/conference`, `/admin/waitlists/workshop`, offer review dialog, `/admin/payments`, `/admin/refund/:id` |
| 33–37 | `/admin/communications`, `/admin/compose`, `/admin/email-preview`, `/admin/reports`, `/admin/export` with recipient/export previews |
| 38 | `/admin/form`; draft questions, hide/show/order, conditions, types, help text, restricted visibility, preview, publish |
| 39–46 | `/admin/settings/` general, registration, workshops, payments, email, branding, team, privacy |
| 47–48, 61 | `/admin/walkin`, `/admin/walkin-status/:id`, pending/declined/paid/arrived states |
| 49 | Working empty, no-results, form-validation, permission, payment failure, capacity and schedule-conflict states |
| 50 | Shared CSS system; original component specification retained in the design reference |
| 51–52 | `/schedule`, calendar download, `/sign-in/sent`, `/sign-in/expired` |
| 62–64 | Registration bulk-action review dialog, `/admin` sign-in and `/admin/mfa` |

## Verification performed

- Automated domain tests cover CUEBC pricing and discounts, required fields, duplicate email prevention, payment recovery/idempotency, registration windows and capacity, workshop conflicts and online eligibility, cancellation, documented bounded refund exceptions, waitlist holds/expiry/acceptance, room capacity and presenter consent, conference copying, role restrictions, and export generation.
- View rendering tests cover public and organizer routes and detect undefined values.
- Browser route audit: 55 routes at 1440px and 390px widths; no broken images, page-width overflow or error fallback pages at the time of audit.
- Visual inspection included the conference home, attendee portal, workshop browser, organizer registration list and mobile navigation. The mobile organizer header was refined after inspection.
- Browser journeys exercised online registration with a discount, workshop selection, declined checkout and recovery, organizer sign-in/MFA, program conflict rejection and workshop creation, message recipient review and simulated delivery, draft form publication, email-change verification, ticket change request/approval, export preview/download action, walk-in pending payment resolved to checked-in, and workshop waitlist offer/acceptance.
- Generated XLSX archives were checked for ZIP/XML integrity and opened with a spreadsheet parser. PDF page/text structure was checked with a PDF parser. CSV formula-like values are escaped; XLSX cells use text types.

## Integration boundary

The local data model is intentionally separate from view rendering. Production integration must replace local persistence and simulated actions with server-side identity/roles, transactional seat allocation, provider payment events, durable email delivery, audited database records, and retention processing. No browser-only implementation can supply these guarantees.

Official CUEBC source links and design research remain in `docs/design/handoff.html`. The current preview is suitable for frontend review and workflow testing, not collecting production registrations.
