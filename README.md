# Appointment Manager

A production-oriented MERN dashboard where an authenticated administrator can view, create, search, filter and update appointments. MongoDB Atlas is the only source of truth; nothing is stored in `localStorage` or hard-coded in the UI.

## Technology stack

| Layer | Tech |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router, Tailwind CSS 4, TanStack Query, React Hook Form + Zod, Axios, Lucide, Luxon |
| Backend | Node.js, Express 4, TypeScript, Mongoose, Zod, Pino, Helmet, express-session + connect-mongo, express-rate-limit, bcryptjs, Luxon |
| Tests | Vitest, React Testing Library, Supertest, mongodb-memory-server |

## Architecture

```
Browser (React SPA) ──/api (cookie session + CSRF header)──▶ Express ──▶ MongoDB Atlas
                                                              │  routes → middleware → controllers → services → models
                                                              └─ sessions stored in MongoDB (connect-mongo)
```

* **Controllers** handle HTTP only; **services** hold business logic; **models** define schemas/indexes; **validators** are Zod schemas applied by `validate()` middleware; a central **error handler** produces the consistent `{ success, message, data | errors }` envelope.
* In production Express also serves the built SPA (with SPA fallback), so the app is **same-origin**: no CORS, first-party `SameSite=Lax` cookies.
* In development Vite proxies `/api` to the API, so cookies behave the same way.
* Filters (`status`, `q`, `page`) live in the URL, so they survive refresh and navigation.

### Folder structure

```
client/            React app (src/{components,pages,hooks,services,schemas,context,utils,types})
server/            Express app (src/{config,controllers,middleware,models,routes,services,validators,utils,scripts})
server/tests/      API tests (Vitest + Supertest + in-memory MongoDB)
.env.example       Every environment variable, placeholders only
```

## Prerequisites

* Node.js 20+ (developed on 24) and npm 10+
* A MongoDB Atlas cluster (no local MongoDB needed)

## Installation

```bash
npm install
cp .env.example .env     # then edit .env
```

### MongoDB Atlas configuration

1. In Atlas create a cluster (the free M0 tier is fine).
2. **Database Access → Add New Database User**: password auth, role *Read and write to any database* (or scoped to your database). Use a strong generated password.
3. **Network Access → Add IP Address**: add your development IP, and your hosting platform's outbound IPs (or `0.0.0.0/0` only if you accept that exposure and rely on the DB credentials).
4. **Database → Connect → Drivers**: copy the `mongodb+srv://…` string, put your user/password in it, and add the database name (e.g. `/appointment_manager`). Percent-encode special characters in the password.
5. Set it as `MONGODB_URI` in your server environment. The URI is never logged or sent to the browser.

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | yes | Atlas connection string |
| `SESSION_SECRET` | yes | ≥ 32 random chars; placeholder rejected in production |
| `CLIENT_ORIGIN` | yes | Exact browser origin for the CORS allow-list |
| `NODE_ENV` | no | `development` (default), `production`, `test` |
| `PORT` | no | default `4000` |
| `APP_TIMEZONE` | no | IANA zone used to interpret/display times; default `Asia/Kolkata` |
| `TRUST_PROXY` | no | proxies in front of the app; default `1` in production |
| `LOGIN_RATE_LIMIT_MAX` | no | login attempts / IP / 15 min; default `10` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for `admin:init` | bootstrap only; password ≥ 12 chars |
| `VITE_APP_TIMEZONE` | no | build-time display zone for the SPA (keep equal to `APP_TIMEZONE`) |
| `VITE_API_URL` | no | defaults to `/api` (same origin) |

The server validates its configuration at startup and exits with a clear message (variable names only, never values) if something is missing.

### Create the administrator

There is no public registration. With `ADMIN_EMAIL` / `ADMIN_PASSWORD` in the environment:

```bash
npm run admin:init
```

The password is bcrypt-hashed (12 rounds). Re-running with an existing email resets that admin's password. Remove `ADMIN_PASSWORD` from the environment afterwards.

### Optional demo data

```bash
npm run seed                        # after admin:init; refuses to run when NODE_ENV=production
npm run seed -w server -- --reset   # first deletes ALL existing appointments, then inserts the samples
```

Inserts the three assessment appointments (Alex Morgan, Jamie Lee, Taylor Smith; interpreted in `Asia/Kolkata`); idempotent, so re-running adds nothing.

## Development

```bash
npm run dev         # API on :4000 and Vite on http://localhost:5173
```

## Production build and run

```bash
npm run build       # client → client/dist, server → server/dist
NODE_ENV=production npm start
```

## Mobile and tablet experience

* **Phones (< 768px)** get a native-style shell: compact header with safe-area padding, fixed bottom tab bar (Home, Appointments, a raised centred Add button, Pending with a live count, Profile), card lists instead of the table, a details/quick-status bottom sheet, a full-screen Add form with a pinned submit button, and a profile screen with logout. The tab bar steps aside while a text field is focused so the on-screen keyboard never squeezes or covers content.
* **Tablets (768-1023px)** keep the dashboard with a collapsible sidebar; **desktops (≥ 1024px)** keep the permanent sidebar and data table.
* Transitions are CSS-only (opacity/transform) and disabled under `prefers-reduced-motion`. Filters live in the URL and are restored when you return to the Appointments tab.
* **PWA readiness:** web manifest, icons and theme colour make the app installable (Add to Home Screen). There is deliberately **no service worker and no offline mode**, so authenticated data is never cached on the device.

## Tests

```bash
npm test            # server (Vitest/Supertest) + client (Vitest/RTL)
npm run typecheck
```

### Tests performed

* **API (Vitest + Supertest, 23 tests):** login success/failure with generic errors, CSRF rejection, auth-required routes, NoSQL-operator payloads rejected (422), validation and impossible dates, duplicate 409, timezone conversion, ordering across the upcoming/past boundary, search + filter + pagination, status update, stats.
* **UI (Vitest + RTL, 20 tests):** login form, desktop and mobile appointment lists, create form validation, bottom tab bar behaviour.
* Manual: UI screenshots at 320, 390 and 422px.

Tests never touch Atlas: server tests use `mongodb-memory-server`, and the test environment is set explicitly. The first run downloads a MongoDB binary (~200 MB).

## API

All responses use `{ "success": true, "message", "data", "pagination"? }` or `{ "success": false, "message", "errors": [{ "field", "message" }] }`. State-changing requests require the `X-CSRF-Token` header.

| Method & path | Auth | Description |
| --- | --- | --- |
| `GET /api/auth/csrf` | – | Issues the session's CSRF token |
| `POST /api/auth/login` | – (rate limited) | `{ email, password }` → session cookie + new CSRF token |
| `POST /api/auth/logout` | – | Destroys the session |
| `GET /api/auth/me` | session | Current administrator |
| `GET /api/appointments` | session | Query: `status` (`All`/`Pending`/`Confirmed`/`Cancelled`), `search`, `page`, `limit` (≤ 50) |
| `POST /api/appointments` | session | `{ customerName, service, date: "YYYY-MM-DD", time: "HH:mm", status? }` → 201; 409 on duplicate |
| `PATCH /api/appointments/:id/status` | session | `{ status }` |
| `GET /api/appointments/services` | session | Allowed services (single source of truth for the UI) |
| `GET /api/dashboard/stats` | session | `{ total, pending, confirmed, cancelled }` from an aggregation |
| `GET /api/health/live`, `/ready` | – | Liveness; readiness (503 if DB disconnected) |

Status codes: 200, 201, 400 (malformed JSON/id), 401, 403 (CSRF), 404, 409, 413, 422 (validation), 429, 500, 503.

### Appointment schema

`customerName`, `customerNameNormalized` (lower-cased, whitespace-collapsed; internal), `service`, `appointmentAt` (UTC `Date`), `status` (`Pending|Confirmed|Cancelled`), `createdBy` (→ Admin), `createdAt`, `updatedAt`. The API returns `id` instead of `_id` and omits internal fields. Admin: `email` (unique), `passwordHash` (never selected by default).

Indexes: `{status, appointmentAt}`, `{appointmentAt}`, `{customerNameNormalized, appointmentAt}`, and unique `{customerNameNormalized, appointmentAt, service}`.

### Time handling

The UI sends a local `date` + `time`; the server converts them with Luxon in `APP_TIMEZONE` to a single UTC instant (impossible dates like `2030-02-30` are rejected). The SPA formats instants back into `VITE_APP_TIMEZONE`, so there is no browser-timezone drift.

### Ordering, search and performance

* Lists show **upcoming appointments first (soonest first), then past ones (latest first)**. This is done with two index-backed queries (`appointmentAt >= now` / `< now`) with skip/limit spanning the boundary, rather than a computed sort.
* Search is a case-insensitive partial match on `customerNameNormalized` using an **escaped** regex (max 100 chars), combined with the status filter. A contains-regex cannot use an index efficiently, but it runs after the `status`/date constraints and with pagination, which is fine into the tens of thousands of rows. For much larger data: switch to prefix matching (anchored `^` regex uses the `{customerNameNormalized, …}` index) or Atlas Search / a text index.
* Projections return only the fields the UI needs; stats are one `$group`; responses are gzip-compressed; TanStack Query caches and invalidates after mutations; routes are lazy-loaded.

## Deployment

Any Node host (Render, Railway, Fly.io, Azure App Service, a VM):

1. Set the environment variables above (`NODE_ENV=production`, `MONGODB_URI`, `SESSION_SECRET`, `CLIENT_ORIGIN` = the public https URL, `TRUST_PROXY` = number of proxy hops, usually `1`).
2. Build: `npm ci && npm run build`. Start: `npm start`.
3. Allow the host's outbound IPs in Atlas Network Access.
4. Run `npm run admin:init` once (locally with the production URI, or as a one-off job).
5. Use `/api/health/live` and `/api/health/ready` as probes. The process shuts down gracefully on `SIGTERM`/`SIGINT`.

Serve the SPA and API from the same origin (as this app does) so session cookies stay first-party. If you deploy the SPA separately, you must change the cookie `sameSite` policy and set `VITE_API_URL`, which weakens CSRF defences; this is not recommended.

### Deploying on Vercel

`vercel.json` defines two services in one project: `client` (Vite SPA, served at `/`) and `server` (Express, served at `/api/*`, entrypoint `server/src/index.ts`). Neither service calls the other server-side (the browser calls `/api` on the same origin), so no bindings are needed. Set `NODE_ENV=production`, `MONGODB_URI`, `SESSION_SECRET` and `CLIENT_ORIGIN` (the deployment URL) in the Vercel project, allow Vercel in Atlas Network Access (serverless IPs vary, so `0.0.0.0/0` is usually required), and run `npm run admin:init` once locally. The in-memory rate limiter is per function instance.

## Security notes

* bcrypt-hashed passwords; generic `401 Invalid email or password` for unknown account and wrong password, with a dummy-hash comparison to equalise timing; login is rate limited, and `/api` has a global limiter.
* Server-side sessions in MongoDB (`connect-mongo`, TTL 8 h, rolling); cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in production; session id regenerated on login. The session id and CSRF token are never exposed to JS storage (CSRF token is held in memory only).
* CSRF: synchronizer token compared in constant time on every non-GET request.
* Helmet headers, CORS allow-list with credentials (no wildcard), 10 kB body limit, strict Zod schemas (unknown fields rejected, so operator objects like `{"$ne": ""}` fail with 422), escaped regex input, ObjectId validation.
* Errors never leak stack traces in production; Pino redacts cookies, CSRF header and passwords; the Mongo URI is never logged.

## Starting data

| Customer | Service | Date / time | Status |
| --- | --- | --- | --- |
| Alex Morgan | Consultation | 2026-11-02 10:00 | Pending |
| Jamie Lee | Follow-up | 2026-11-02 11:30 | Confirmed |
| Taylor Smith | Review | 2026-11-03 14:00 | Cancelled |

Loaded with `npm run seed` (see above).

## Completed features

* Admin-only login/logout with server-side sessions, CSRF protection and rate limiting; no public registration.
* Appointment list with status filter, partial case-insensitive name search, pagination (upcoming first, then past) and URL-persisted filters.
* Create appointment (validation, duplicate detection, Asia/Kolkata input stored as UTC) and update status.
* Dashboard statistics (total/pending/confirmed/cancelled) from one aggregation.
* Responsive UI: desktop sidebar + table with account menu (View profile, Sign out), tablet layout, phone app shell with bottom tabs, cards, bottom sheets and full-screen Add form; installable (manifest, no offline).
* Health probes, env validation, structured logging.

## Incomplete items

* No edit or delete of appointments, and no password change screen (re-run `npm run admin:init`).
* No multi-user roles, email/SMS reminders, or calendar view.
* No offline mode or push notifications (deliberate, see PWA note).

## Technical decision: two-query ordering instead of a computed sort

The brief wants upcoming appointments soonest-first, then past ones latest-first. A single sort cannot express that without a computed field (e.g. `` in an aggregation), which prevents index use and has to be rebuilt as time passes. Instead the service runs two index-backed queries (`appointmentAt >= now` ascending, `< now` descending) and applies skip/limit across the boundary. The cost is a little more service code and one extra `count`; the benefit is correct ordering that never goes stale and stays fast as data grows.

## Known limitations

* Single administrator role; all admins see all appointments (`createdBy` is recorded for future per-user scoping).
* Appointments cannot yet be edited or deleted (only created and status-updated) — not required by this version.
* Status counts on the filter tabs are global totals, not narrowed by the current search text.
* Uses an in-process rate-limit store; with several instances use a shared store (e.g. Redis).
* Safe-area insets (`env(safe-area-inset-*)`) are implemented but they were not verified on a notched device; on-screen keyboard behaviour was verified by focus logic, not a real keyboard.
