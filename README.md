# CUEBC Platform

Development home for a CUEBC-specific conference registration and management platform.

## Current baseline

The reviewed visual design set is in [`docs/design`](docs/design/index.html): 70 desktop screens and states, 23 mobile views, official identity assets, editable HTML/CSS, and a source-linked [design handoff](docs/design/handoff.html).

Open `docs/design/index.html` in a browser after cloning or downloading the repository. The gallery works offline. The HTML screens illustrate navigation and interface states; they are not yet the functional frontend.

## Next implementation phase

Build the attendee and organizer frontend from the reviewed mockups, including responsive layouts, working navigation, registration validation, calculated ticket totals, workshop filtering and selection, management tools, and simulated confirmation/payment/waitlist states.

Use clearly labelled sample data behind a replaceable data-service interface. Include a demo reset option so complete journeys can be tested repeatedly. Persistent records, authentication and permissions, payment processing, email delivery, and atomic capacity enforcement will be connected and tested in the backend phase.

## Scope

- Attendee: conference home, program, workshop details, registration and payment flow, confirmation, My CUEBC, receipts, editing, messages, and online access.
- Organizer: conference library, dashboard, registrations and attendee detail, program and presenters, waitlists, payments, communications, reports and exports, form builder, conference settings, and walk-in registration.
- Supporting states: pending/failed payments, closed registration, cancellation, waitlist offers, access recovery, permissions and conflict handling.

## Data and launch boundaries

Sample identities, operational counts, capacities, room assignments and status examples are illustrative. Confirmed 2026 event information and ticket prices are documented with sources in the design handoff.

CUEBC must approve final policy text, receipt/tax details, configuration and unpublished event information before live release. No real attendee data, credentials or payment secrets belong in this repository.

## Ownership and hosting

This private repository belongs to `bd8s7bmpnr-lang`. A development hosting service has not been connected. Repository creation does not publish the website.
