# Backend foundation — milestone 1

The public site remains the browser-only preview. This milestone adds a reproducible Supabase database foundation and separate development/test configuration. It does **not** enable live registrations, authentication workflows, payments, or attendee data access.

## What is implemented

- Pinned Supabase CLI and PostgreSQL client dependencies, with an npm lockfile.
- PostgreSQL 17 migration for organizations, profiles, memberships, conferences, rooms, time blocks, tickets, presenters and workshops.
- Database constraints for money, capacity, dates, category/role values, uniqueness, and same-conference references.
- Row-level security enabled and forced, no attendee/organizer table grants, and safe default privileges for future objects. Milestone 2 will add narrowly scoped policies and APIs.
- A public compatibility probe that returns only service name and foundation schema version.
- Fictional local fixtures, kept outside automatic migrations/seeding. Production installation starts empty.
- Explicit demo/local/test/production configuration validation. Demo cannot make backend calls; backend modes cannot use preview persistence. Secret/service-role keys are rejected by browser configuration.
- A preview storage boundary that preserves the current storage key and existing tester data.
- A local runner that cannot link, deploy, push to, or reset a hosted project.
- A separate verification workspace, two clean database rebuilds, relational/security checks, and API checks in GitHub Actions.

## Install and run

Use Node 20 or newer (CI uses Node 22):

```sh
npm ci
npm test
npm run check
npm run backend:start
npm run backend:status
npm run backend:stop
```

The default development runtime is Supabase's **experimental native runtime**, supported on Apple silicon macOS 14+ and supported Linux. The CLI is pinned at 2.119.0 because these experimental commands are not covered by upstream compatibility guarantees. Downloads are checksum-verified by Supabase. No global application installation, paid account, or cloud project is required.

If Docker or Podman is already available, use the corresponding runtime for a newly created local environment:

```sh
CUEBC_LOCAL_RUNTIME=docker npm run backend:start
CUEBC_LOCAL_RUNTIME=docker npm run test:backend
```

A local stack keeps its chosen runtime; changing that variable cannot convert an existing database. Preserve any needed data before deliberately creating a new environment. The CLI also ties its local identity to directory and Git branch. The wrapper reports the actual API address; do not assume port 54321.

All runtime state, database files, service downloads and diagnostics stay under ignored `.local/`. The database uses local development credentials and loopback connections. Never expose the local development ports to a public network. Production will use managed Supabase with different keys, configuration and identities.

### Sandboxed execution on this Mac

The agent session's sandbox denied PostgreSQL's `shmget` shared-memory call during local startup. The SQL or application code cannot resolve that operating-system restriction. The native runtime must be started from an ordinary supported terminal session, or development can run in an approved Docker/hosted development environment. Do not weaken the sandbox or treat a mocked database as proof of a full Supabase installation.

GitHub Actions runs the real backend checks on a supported Linux Docker runner. Its result provides installation evidence for that environment; it does not claim that startup succeeded inside the Mac agent sandbox.

## Verify a clean installation

```sh
npm run test:backend
```

This command prepares `.local/verification/supabase` using the committed config and migrations. It starts a **separate** local project, rebuilds that verification database twice, and verifies each pass:

1. Migrations install into a clean database with no organization or attendee fixtures.
2. Applying fictional fixtures twice creates no duplicates and no auth accounts.
3. All nine application tables enforce row-level security; anonymous/authenticated roles cannot read/write them or access the private schema.
4. Database checks reject negative prices, invalid capacity/dates/enums, duplicate ticket categories and cross-conference references.
5. Future tables/functions do not inherit unintended public permissions.
6. The health endpoint is reachable over the actual REST API; application tables reject public reads.

Only the verification database is reset. Development state is not a reset target. Hosted URLs and inherited cloud configuration are rejected/removed by the runner. Its success report is `.local/verification-result.json`; CLI diagnostics remain in `.local/last-cli.log`. Do not commit the local directory or upload raw service diagnostics containing keys. CI uploads only the sanitized verification summary.

`npm run verify` runs frontend/unit checks, syntax checks and database verification together. A skipped/failed database check is not a passing milestone. The GitHub workflow does not publish the website or deploy to a cloud database.

## Environment separation

| Environment | Identity and data | Behaviour in this milestone |
| --- | --- | --- |
| Demo | Existing browser-local fictional dataset | Current public preview, unchanged visual flows; no backend connection |
| Local | Local Supabase project, fictional catalog fixtures | Database and health probe; table access denied until milestone 2 |
| Test | A distinct future hosted Supabase project | Configuration contract/template only; no hosted account created |
| Production | CUEBC-owned future Supabase project | Configuration contract/template only; no keys, personal data or cloud deployment |

Examples live in `config/environments/`. Placeholder keys intentionally fail validation until replaced. These examples are not served as active frontend configuration. `docs/app/environment.js` explicitly selects the demo; an environment change must be a deliberate deployment change, not a URL parameter or localStorage setting. The full non-demo frontend flow will be connected alongside real identity in milestone 2 and registration in milestone 3; it currently fails closed rather than pretending that demo writes reach Supabase.

Use separate project references and keys for hosted test and production. Browser configuration can contain only the URL and publishable/legacy anon key. Server secrets, Stripe keys and database URLs must stay outside `docs/` and Git. `.env*` and runtime state are ignored. Do not seed live projects with the local fixtures.

## Schema evolution and next milestone

Committed migrations are append-only after acceptance. Apply future changes with new migrations, preserving existing data. This foundation deliberately does not prebuild the payment ledger or transactional seat-allocation API: their tested implementations belong to milestone 3. Conference publication history and form versions will arrive with the corresponding organizer workflows.

Milestone 2 adds verified users, sign-in/MFA, memberships, invitation/revocation flows, field restrictions, and allow/deny tests before any business table is opened to frontend access. The local `profiles` and `organization_memberships` structures are foundations, not a completed identity implementation.

## Sources

- [Supabase local development](https://supabase.com/docs/guides/local-development)
- [Docker and native runtimes](https://supabase.com/docs/guides/local-development/docker-and-native-runtimes)
- [Local project isolation](https://supabase.com/docs/guides/local-development/running-multiple-local-projects)
- [Row-level security and grants](https://supabase.com/docs/guides/database/postgres/row-level-security)

The existing public GitHub repository still contains only source, configuration templates and fictional examples. No production licensing enforcement or commercial agreement is implemented by this milestone.
