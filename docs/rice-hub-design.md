# Rice Hub — Design Document

MERN app for showcasing Linux desktop customizations ("rices"): screenshots,
metadata (distro, WM, bar, launcher, color scheme), and a link to the user's
dotfiles GitHub repo. No uploads or dotfile parsing — `dotfilesUrl` is a plain
URL.

Built to fulfill 10 fixed coursework experiments. Status per experiment lives
in `AGENTS.md`.

## Tech stack

- **Frontend**: React 19, react-router v8 (declarative mode), Tailwind CSS v4
  (CSS-first config — all tokens in `frontend/src/index.css`), Vite.
- **Backend** (Exp 4+): Node/Express + MongoDB via Mongoose.

## Backend architecture

```
backend/
├── package.json
├── .env.example          # MONGODB_URI, PORT, CORS_ORIGIN
├── .env                  # gitignored
├── server.js             # Entry: load env, connect DB, security middleware
│                         #   (helmet → cors → json → mongo-sanitize → rate
│                         #   limit), mount routes, 404 + error handler
├── config/
│   └── db.js             # mongoose.connect() with event logging
├── models/
│   ├── Rice.js           # Mongoose schema + model
│   ├── User.js           # handle (unique), email (unique), passwordHash, role
│   └── Comment.js        # rice ref, authorId, authorHandle snapshot, text
├── routes/
│   ├── auth.js           # POST register / login → { token, user }
│   ├── rices.js          # CRUD router + validation rules (express-validator),
│   │                     #   incl. comment list/create subroutes
│   └── admin.js          # Moderation router — whole router behind
│                         #   authMiddleware + requireAdmin
├── middleware/
│   ├── validate.js       # validate(rules): runs validator chains → 400 envelope
│   ├── auth.js           # authMiddleware (Bearer JWT), optionalAuth,
│   │                     #   requireAdmin, requireOwnerOrAdmin
│   ├── notFound.js       # Unknown /api route → 404 envelope
│   └── errorHandler.js   # Centralized error → { success: false, error }
├── realtime/
│   └── comments.js       # Socket.IO: JWT handshake, rooms, comment:send relay
├── seeds/
│   └── seed.js           # Clears + inserts seed rices
└── scripts/
    └── mongo.sh          # Podman start/stop helper
```

### API endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create account `{handle,email,password}` → `{token,user}` |
| `POST` | `/api/auth/login` | — | `{identifier,password}` (handle or email) → `{token,user}` |
| `GET` | `/api/rices` | optional | List with search, filter, sort, pagination. **APPROVED only** — see [Moderation](#moderation--administration) |
| `GET` | `/api/rices/batch` | — | Fetch many by `ids` (csv, ≤50, valid ObjectIds); APPROVED only |
| `GET` | `/api/rices/mine` | Bearer | Rices owned by the token's handle. **Unfiltered** — owners see their own PENDING/REJECTED |
| `GET` | `/api/rices/:id` | optional | Get single rice (increments views). 404 for non-approved unless caller is author or admin |
| `POST` | `/api/rices` | Bearer | Create rice (validated body; `author` = token handle). **`status` stripped from the body — always created PENDING** |
| `PUT` | `/api/rices/:id` | Bearer | Update rice — owner or admin only |
| `DELETE` | `/api/rices/:id` | Bearer | Delete rice — owner or admin only |
| `POST` | `/api/rices/:id/like` | Bearer | Toggle caller's handle in `likes[]` |
| `GET` | `/api/rices/:id/comments` | — | Comment history — `?limit=` (1–100, default 50), `?before=<commentId>` cursor, chronological |
| `POST` | `/api/rices/:id/comments` | Bearer | Post a comment (`text` 1–500 chars); also live-broadcasts to the rice's socket room |
| `GET` | `/api/health` | — | Health check (skips rate limit) |
| `GET` | `/api/admin/stats` | Admin | Counts by rice status + users/admins + comments |
| `GET` | `/api/admin/rices` | Admin | Moderation list — `?status=PENDING\|APPROVED\|REJECTED\|ALL` (default `PENDING`), `?search=`, `?page=`, `?limit=` |
| `PATCH` | `/api/admin/rices/:id/status` | Admin | `{status}` — the only route that writes `status` |
| `GET` | `/api/admin/users` | Admin | `?search=` (handle or email), `?role=user\|admin`, paginated → safe-JSON rows |
| `PATCH` | `/api/admin/users/:id/role` | Admin | `{role}` — refuses self-demotion |
| `GET` | `/api/admin/comments` | Admin | `?riceId=`, `?limit=` — newest first, rice title populated |
| `DELETE` | `/api/admin/comments/:id` | Admin | Delete + broadcast `comment:delete` to the rice's socket room |

Response envelope: `{ success: boolean, data?, error? }`. Unknown `/api`
routes return a JSON 404 envelope; malformed JSON returns
`400 Invalid JSON body`.

### Validation & error handling (Experiment 5)

Middleware order in `server.js`: `helmet` → `cors` (origin from
`CORS_ORIGIN`, comma-separated) → `express.json` → `express-mongo-sanitize`
(strips `$`/`.` operators from query/body) → rate limiter (60 req/min per IP
on `/api/*`, `/api/health` skipped → `429 Too many requests`) → routers →
`notFound` → `errorHandler`. The ceiling is 60 because a single admin page
load fires four parallel reads (stats + one per tab).

Validation via `express-validator` in `routes/rices.js`, run by
`middleware/validate.js`; failures respond `400 { success, error }` with all
messages joined.

| Input | Rule |
|---|---|
| `title`, `wm` | required, trimmed, non-empty (POST; optional on PUT) |
| `distro` | one of Arch, Debian, Ubuntu, Fedora, NixOS, Other |
| `dotfilesUrl` | must match `https?://…` |
| `author` | optional, 1–40 chars (ignored from Exp 6 once JWT owns it) |
| `images` | ≤10 entries, each an http(s) URL |
| `tags` | ≤10 entries, each ≤32 chars, uppercased |
| `page`, `limit` | clamped, never rejected (`page` ≥1, `limit` 1–50) |
| `sort` | one of NEWEST, TRENDING, TOP_ALL_TIME (else 400) |
| `ids` (batch) | required, 1–50 comma-separated valid ObjectIds |

POST/PUT bodies are whitelisted through `matchedData` — `likes`, `views`,
`status`, `createdAt`, `role` etc. sent by clients are silently stripped
(never trusted). TRENDING/TOP_ALL_TIME sorting runs a Mongo aggregation on
`likes.length` (fixed in Exp 5). Errors: mongoose `ValidationError` → 400,
`CastError` → 400 `Invalid ID format`, anything ≥500 → generic
`Internal server error` (stack logged, never leaked).

## Authentication (Experiment 6)

JWT accounts with ownership + roles; all public reads stay open.

- **User model**: `handle` (unique, stored lowercase with `@` prefix),
  `email` (unique), `passwordHash` (bcrypt, 10 rounds), `role: user|admin`
  (default `user`), timestamps. `toSafeJSON()` never exposes the hash.
- **Register** validates handle (`3–30` chars `[a-z0-9_]`, `@` optional in
  input), email, password (8–100); duplicates → `409`. **Login** takes
  `identifier` = handle (±`@`) or email + password; failures always return
  `401 Invalid credentials` (never reveals which field was wrong).
- **Token**: `jwt.sign({ id, handle, role }, JWT_SECRET, expiresIn:
  JWT_EXPIRES_IN || '7d')`. Server refuses to start without `JWT_SECRET`.
  Contract: `Authorization: Bearer <token>`; `authMiddleware` sets
  `req.user = { id, handle, role }`; `JsonWebTokenError` /
  `TokenExpiredError` → `401 Invalid or expired token`.
- **Ownership**: `requireOwnerOrAdmin` loads the rice first — non-owners get
  `403 You do not own this rice`, admins may edit anything. `POST /rices`
  overwrites `author` from the token (client-sent `author` is ignored from
  Exp 6 onward). `POST /:id/like` `$addToSet`/`$pull`s the caller's handle.
- **Seeded demo accounts** (passwords from `.env` via
  `SEED_USER_PASSWORD` / `SEED_ADMIN_PASSWORD` — placeholders in
  `.env.example`, real values only in gitignored `.env`): `@demo` (user),
  `@admin` (admin). `npm run seed` recreates them.
- Auth routes sit under the same 60 req/min `/api` limiter — a failed-login
  burst is throttled like everything else.

## Moderation & administration

Additive beyond the 10 coursework experiments: submissions are no longer
public the moment they're posted, they enter a moderation queue.

### Lifecycle

```
POST /api/rices ──> PENDING ──approve──> APPROVED ──> visible in /api/rices
                        │
                        └────reject────> REJECTED ──> author can edit & resubmit
```

- **`POST /api/rices` always creates `PENDING`.** `status` is stripped from
  request bodies on both create and update, so the only way to change it is
  `PATCH /api/admin/rices/:id/status`.
- **Browse is APPROVED-only.** `GET /api/rices` forces
  `status = 'APPROVED'` for anonymous and ordinary users; an admin may pass
  `?status=` to widen their own query. `/api/rices/batch` filters on APPROVED
  too, so a crafted batch id list cannot pull in pending work.
- **`GET /api/rices/:id` 404s** for a non-approved rice unless the caller is
  the author or an admin. The view counter is incremented *only after* that
  gate passes, so probing ids can't leak view counts for hidden rices.
- **`GET /api/rices/mine` is deliberately unfiltered** — an author must be
  able to see and edit their own rejected work.

### Guards

| Middleware | Behaviour |
|---|---|
| `authMiddleware` | 401 without a valid Bearer token; sets `req.user` |
| `optionalAuth` | Populates `req.user` when a valid token is present, **never rejects** — a bad token just stays anonymous. Used on public reads |
| `requireAdmin` | 403 unless `req.user.role === 'admin'`; chained after `authMiddleware` |
| `requireOwnerOrAdmin` | Loads the rice first; non-owners get 403 |

`routes/admin.js` calls `router.use(authMiddleware, requireAdmin)` once at the
top, so every route in the file is guarded by construction — a new route
added below it cannot ship unauthenticated.

### Two things worth knowing

- **Role is frozen in the JWT.** `jwt.sign({ id, handle, role })` means a
  newly promoted admin keeps their old token's `role: 'user'` until they log
  in again. The frontend 403 panel says so explicitly.
- **The last-admin guard is defence in depth.** Because `requireAdmin` gates
  the router, the only admin is by definition the caller, so self-demotion is
  blocked first and `Cannot demote the last admin` is unreachable in practice.
  It's kept as a cheap invariant if the guard order ever changes.

## Realtime comments (Experiment 8)

Comments are persisted (REST is the source of truth) and pushed live over
Socket.IO on the same HTTP server (`httpServer` in `server.js`).

- **Comment model**: `{ rice (ref, indexed), authorId (ref User),
  authorHandle (snapshot), text (trim, ≤500), createdAt }`.
- **Handshake**: client connects with `io(url, { auth: { token } })`. Missing
  token → anonymous read-only connection; invalid/expired token → server
  disconnects the socket.
- **Client → server**: `join` / `leave` with a rice id (joins `rice:<id>`
  room), `comment:send` `{ riceId, text }` with an ack callback. Send requires
  an authenticated socket, text is validated (1–500 chars) and each socket is
  rate-limited to ~1 comment/second.
- **Server → client**: `comment:new` broadcast to the rice's room — emitted
  for both socket sends and REST posts (REST fallback keeps disconnected
  clients consistent). Text is rendered as plain text only.
- **Client** (`components/CommentsPanel.jsx`): loads history via
  `useFetch(fetchComments)`, then layers live `comment:new` events (deduped
  by `_id`). Sends are optimistic with rollback on error; the HTTP POST path
  (`postComment`) is the fallback when the socket is down. Anonymous viewers
  see history but get a login link instead of the composer.
- **Admin deletion is realtime too**: `DELETE /api/admin/comments/:id` emits
  `comment:delete {commentId, riceId}` to the rice's room, and
  `CommentsPanel` drops the row from its live buffer (the REST history is
  re-read on next mount).
- The HTTP comment routes stay under the Exp 5 60 req/min `/api` limiter —
  that throttling is intended and documented here.

## Containerization (Experiments 7 & 9)

Three containers on one compose network (`docker-compose.yml` at repo root):

| Service | Image | Host port | Notes |
|---|---|---|---|
| `mongo` | `mongo:7` | — (internal only) | named volume `mongo-data`; `mongosh` ping healthcheck |
| `backend` | build of `backend/Dockerfile` | `5000` | `npm ci --omit=dev`, non-root `node` user; `/api/health` healthcheck |
| `frontend` | build of `frontend/Dockerfile` | `5173` | multi-stage: Vite build → nginx:1.27-alpine static serve |
| `seed` | same build as backend | — | `profiles: ["seed"]` one-off; `docker compose --profile seed run --rm seed` |

- **Topology mirrors local dev**: the frontend is built with
  `VITE_API_URL=http://localhost:5000/api` (build ARG), so the *browser*
  calls the host-published backend directly and `CORS_ORIGIN` stays
  `http://localhost:5173` — same as the Vite dev setup. Only `VITE_API_URL`
  is baked at build time; changing it requires a rebuild of the frontend
  image only.
- **Backend env** comes from a shared compose anchor (`x-backend-env`):
  `MONGODB_URI=mongodb://mongo:27017/ricehub` plus `JWT_SECRET`,
  `JWT_EXPIRES_IN`, and the two `SEED_*_PASSWORD` vars, each with
  `${VAR:-default}` substitution so a root `.env` (gitignored) can override
  secrets without editing the compose file. `server.js` still refuses to
  start without `JWT_SECRET`.
- **Startup ordering**: `backend` waits for the mongo healthcheck;
  `frontend` waits for the backend to start. If the backend races mongo on
  a cold start, `connectDB`'s `exit(1)` plus the `restart` policy retries.
- `frontend/nginx.conf` provides the BrowserRouter SPA fallback
  (`try_files … /index.html`) and long-term caching for hashed `/assets/`.
- `.dockerignore` in both app dirs keeps `node_modules`, `dist`, `.env*`
  and docs out of build context (the local `backend/.env` is never baked
  into the image).

## Frontend architecture

```
frontend/src/
├── components/          # Navbar, Footer, Layout, cards (RiceCard, DashboardCard,
│   │                    #   SavedRiceCard, SubmitRiceCard), FilterSidebar,
│   │                    #   FilterCheckbox, MetaChip, StatusBadge, Pagination,
│   │                    #   RiceCardSkeleton, route guards
│   │                    #   (ProtectedRoute, AdminRoute)
│   ├── admin/           # ModerationCard, UsersTab, CommentsTab (admin only)
│   └── form/            # shared primitives: FormField, TextField, SelectField
├── context/             # Exp 3: global state (see "Context layer" below)
├── hooks/               # useFetch, useForm, useDebounce + context accessors
│                        #   (useAuth, useFilters, useSavedRices)
├── data/                # mockRices.js, mockApi.js, filterOptions.js
├── pages/               # Home, Login, Dashboard, Submit, RiceDetail, Admin
├── utils/format.js      # formatCount
├── App.jsx              # routes only
├── main.jsx             # BrowserRouter + provider tree live here
└── index.css            # @theme tokens + custom utilities
```

### Data flow

`data/mockApi.js` is the API seam: `fetchRices({ query, filters })` makes real
HTTP calls to the backend API at `http://localhost:5000/api`. Exp 5 added
`createRice` / `updateRice` / `deleteRice` (used by `pages/Submit.jsx`, which
shows server envelope errors as `> ERR: …`). Response envelope contract:
always `{ success, data?, error? }`.

Authenticated calls go through the private `request(path, { method, body,
token })` helper, which sets `Authorization: Bearer`, unwraps `json.data`, and
throws on `!success`. The admin API sits behind it too
(`fetchAdminStats`, `fetchAdminRices`, `setRiceStatus`, `fetchAdminUsers`,
`setUserRole`, `fetchAdminComments`, `deleteComment`) — note it uses the
safe-JSON **`id`** field for users, never `_id`.

Data fetching goes through `useFetch(fetcher)` only — never raw fetch/axios in
component bodies. The fetcher must be referentially stable (wrap in
`useCallback`, as in `pages/Home.jsx`).

### Admin page patterns

`pages/Admin.jsx` holds one tab (`queue` | `all-rices` | `users` |
`comments`) and four `useCallback` fetchers, one per tab. A single
`activeLoad` ternary picks the fetcher for the active tab, so switching tabs
swaps the fetcher identity and `useFetch` refetches. Each fetcher's deps are
`[token, ...filters]`, and search inputs are `useDebounce`d at 300 ms.

Mutations (approve/reject/delete, role changes) patch **local overlays** —
`removedRiceIds`, `riceStatusOverrides`, `roleOverrides`, `removedCommentIds`
— exactly like `pages/Dashboard.jsx` already does. Approving from the queue
also adds the id to `removedRiceIds`, since approved work leaves the PENDING
view.

Explicit refetching goes through `useFetch`'s optional second argument:

```js
const [refreshKey, setRefreshKey] = useState(0)
const { data, loading, error } = useFetch(activeLoad, refreshKey)
```

The REFRESH button bumps `refreshKey`, which re-runs the effect without
disturbing the other four overlays.

> **React Compiler caveat — do not put `refreshKey` in the fetcher's
> `useCallback` deps.** The compiler memoises on the values a callback
> actually *reads* in its body and silently discards the rest. A dep that is
> never referenced leaves the memoised fetcher's identity unchanged, so
> `useFetch`'s effect never re-runs and the refresh button does nothing at all
> — with no error and no visible clue. `useFetch` therefore calls
> `fetcher(refreshKey)`, passing the counter in as an argument so it stays a
> real, observable dependency. Fetchers are free to ignore the argument.

## Context layer (Experiment 3)

Three independent providers wrap the app in `main.jsx`
(Auth → SavedRices → Filters). Each domain follows the same file pattern:

| Domain | Context object | Provider | Hook |
|---|---|---|---|
| Auth | `context/AuthContext.js` | `context/AuthProvider.jsx` | `hooks/useAuth.js` |
| Saved rices | `context/SavedRicesContext.js` | `context/SavedRicesProvider.jsx` | `hooks/useSavedRices.js` |
| Browse filters | `context/FiltersContext.js` | `context/FiltersProvider.jsx` | `hooks/useFilters.js` |

Context objects live in their own modules (no component exports) so files stay
fast-refresh/lint clean; hooks throw if used outside their provider.

Contracts:

- **Auth** — `{ user, token, login(identifier, password),
  register(handle, email, password), logout() }`. Real JWT flow as of
  Exp 6: `login`/`register` call `/api/auth/*`, session
  `{ user, token }` mirrored to `sessionStorage['ricehub.user']`
  (tab-scoped; legacy Exp 3 entries without a token are logged out).
  `user` = `{ id, handle, email, role }` from the server. Guards:
  `components/ProtectedRoute.jsx` wraps `/dashboard` and `/submit`;
  unauth → `/login?next=<path>`.
- **Saved rices** — `{ savedIds, isSaved(id), toggleSave(id) }`. In-memory
  only (no persistence by design). Producers: bookmark button on `RiceCard`,
  remove button on `SavedRiceCard`. Consumer: Dashboard's saved tab resolves
  `savedIds` against mock data; shows an empty state when none are saved.
- **Filters** — `{ search, setSearch, sort, setSort, selectedFilters,
  toggleFilter(field, value), clearFilters() }`. `selectedFilters` shape:
  `EMPTY_FILTERS` = `{ distro: [], wm: [], colorScheme: [] }`. Consumed by
  Home (search/sort inputs) and FilterSidebar. `sort` is now passed to the
  backend API for server-side sorting.

## Design system

Neo-brutalist dark theme ("Rice Hub Core"): 2px borders, hard offset shadows
(no blur), sharp corners, monospaced labels. Tokens live in the `@theme` block
of `frontend/src/index.css`: surfaces `#0e0e0e`–`#393939`, text
`on-surface`/`on-surface-variant`, borders `outline`/`outline-variant`,
accents `terminal-green` (#00FF41) / `neon-cyan` / `warning-orange`, shadows
`shadow-hard(-green)(-sm)`. Page container: `max-w-page` (1200px). Fonts:
Space Grotesk (display), Inter (body), JetBrains Mono (labels/code), Material
Symbols Outlined (icons).

## Rice schema (target)

```
title, description, author, images[], distro, wm, bar, launcher,
colorScheme, terminal, dotfilesUrl, tags[], likes[], views, status, createdAt
```

`dotfilesUrl` is a plain URL — no upload/parsing/install-script features.
Mock data and Mongoose model are now aligned with this schema (Exp 4).

## API contract

REST under `/api/*`; envelope `{ success, data?, error? }`. Validation,
sanitization, rate limiting, and security headers ship as of Exp 5 — client
bodies are whitelisted, so `likes`/`status`/`views` from the client are
untrusted. JWT auth ships as of Exp 6: `Authorization: Bearer <token>` on
all write routes, `authMiddleware` + `requireOwnerOrAdmin`, `author` derived
from the token, roles never trusted from the client.

Frontend fetch helpers (`mockApi.js`) take an optional trailing `token` and
set the Bearer header; public GETs stay tokenless. `useFetch` fetchers must
be referentially stable (`useCallback`) — an inline fetcher retriggers the
effect every render in an infinite refetch loop (RiceDetail bug, caught by
the Exp 5 rate limiter, fixed in Exp 6).
