# CUEBC conference platform

An interactive, responsive frontend for CUEBC conference registration and management, using the approved mockup styles and official CUEBC assets.

- [Live frontend](https://bd8s7bmpnr-lang.github.io/cuebc-platform/)
- [Organizer workspace](https://bd8s7bmpnr-lang.github.io/cuebc-platform/#/admin)
- [Original design reference](https://bd8s7bmpnr-lang.github.io/cuebc-platform/design/index.html)

## Try the preview

Use **Preview controls** to switch attendee accounts and organizer roles, turn on conference-day online access, open the local email inbox, or restore the seed data. Changes persist in this browser and are isolated from other visitors.

Organizer sign-in uses the displayed demo identity and verification code **123456**. Attendee sign-in links are delivered to the preview inbox; `attendee1@example.test` is a seeded attendee. New registrations must use fictional contact details. **Fill with sample details** supplies a unique fictional attendee to make testing quick. Saved workshop shortlists are separate for each attendee and conference.

## Implemented frontend

Attendees can search/filter workshops, save a day plan, register using CUEBC ticket categories, apply valid discount codes, simulate approved/declined/pending checkout, recover payment, view their portal, edit details, verify an email change, request a ticket change, select workshops, accept waitlist offers, access simulated online rooms, read messages, download receipts/calendar files, and cancel under the no-refund policy.

Organizers can create/copy conferences, manage registrations and arrivals, review bulk actions, edit attendees, approve ticket requests, schedule workshops with conflict/capacity checks, manage presenters, publish program drafts, issue expiring waitlist offers, reconcile payments, record authorized refund exceptions, compose/review targeted messages, download reports and custom CSV/XLSX exports, draft/publish registration questions, configure conference settings, manage demo team roles, export data requests, inspect audit history, archive conferences, and register walk-ins.

## Scope boundary

This is a frontend preview, **not a live registration service**. Authentication, authorization, email, payment processing, meeting access, invitations, and retention jobs require the future backend. Client role restrictions demonstrate interface behavior; they do not secure data. There are no secrets, real payments, or real attendee records in this public repository. Browser storage is not suitable for production personal information.

Workshop titles and presenter names are based on CUEBC's published offerings. Workshop times, room assignments, capacities, presenter biographies, and organizer records are illustrative. Final policies, contact details, sender/provider connections, receipt issuer/tax details, and the program schedule require CUEBC confirmation.

## Development

No build step or third-party frontend dependencies are required. Serve `docs/` with a local static server, for example:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory docs
npm test
npm run check
```

GitHub Pages publishes `main:/docs`. Hash routing supports direct page links and refreshes under the repository subpath.

- `docs/app/model.js`: state, seed records and domain rules
- `docs/app/views.js`: attendee views
- `docs/app/admin.js`: organizer views
- `docs/app/app.js`: routing, event handling and persistence
- `docs/app/ui.js`: shared components and file exports
- `docs/design/styles.css`: unchanged original design tokens and components
- `docs/app/app.css`: interactive and responsive extensions
- `tests/model.test.js`: business rules, exports and route-render regression checks

See `FRONTEND-COVERAGE.md` for the mockup-to-implementation map and validation record.

## Backend foundation

Milestone 1 adds an isolated Supabase development foundation, database migrations, environment safeguards and repeatable database tests. The public frontend remains in demo mode. See [BACKEND.md](BACKEND.md) for installation, verification, scope, and the local sandbox limitation.
