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
│   └── rices.js          # CRUD router + validation rules (express-validator),
│                         #   incl. comment list/create subroutes
├── middleware/
│   ├── validate.js       # validate(rules): runs validator chains → 400 envelope
│   ├── auth.js           # authMiddleware (Bearer JWT) + requireOwnerOrAdmin
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
| `GET` | `/api/rices` | — | List with search, filter, sort, pagination |
| `GET` | `/api/rices/batch` | — | Fetch many by `ids` (csv, ≤50, valid ObjectIds) |
| `GET` | `/api/rices/mine` | Bearer | Rices owned by the token's handle |
| `GET` | `/api/rices/:id` | — | Get single rice (increments views) |
| `POST` | `/api/rices` | Bearer | Create rice (validated body; `author` = token handle) |
| `PUT` | `/api/rices/:id` | Bearer | Update rice — owner or admin only |
| `DELETE` | `/api/rices/:id` | Bearer | Delete rice — owner or admin only |
| `POST` | `/api/rices/:id/like` | Bearer | Toggle caller's handle in `likes[]` |
| `GET` | `/api/rices/:id/comments` | — | Comment history — `?limit=` (1–100, default 50), `?before=<commentId>` cursor, chronological |
| `POST` | `/api/rices/:id/comments` | Bearer | Post a comment (`text` 1–500 chars); also live-broadcasts to the rice's socket room |
| `GET` | `/api/health` | — | Health check (skips rate limit) |

Response envelope: `{ success: boolean, data?, error? }`. Unknown `/api`
routes return a JSON 404 envelope; malformed JSON returns
`400 Invalid JSON body`.

### Validation & error handling (Experiment 5)

Middleware order in `server.js`: `helmet` → `cors` (origin from
`CORS_ORIGIN`, comma-separated) → `express.json` → `express-mongo-sanitize`
(strips `$`/`.` operators from query/body) → rate limiter (30 req/min per IP
on `/api/*`, `/api/health` skipped → `429 Too many requests`) → routers →
`notFound` → `errorHandler`.

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
- Auth routes sit under the same 30 req/min `/api` limiter — a failed-login
  burst is throttled like everything else.

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
- The HTTP comment routes stay under the Exp 5 30 req/min `/api` limiter —
  that throttling is intended and documented here.

## Frontend architecture

```
frontend/src/
├── components/          # Navbar, Footer, Layout, cards (RiceCard, DashboardCard,
│   │                    #   SavedRiceCard, SubmitRiceCard), FilterSidebar,
│   │                    #   FilterCheckbox, MetaChip, Pagination, RiceCardSkeleton
│   └── form/            # shared primitives: FormField, TextField, SelectField
├── context/             # Exp 3: global state (see "Context layer" below)
├── hooks/               # useFetch, useForm, useDebounce + context accessors
│                        #   (useAuth, useFilters, useSavedRices)
├── data/                # mockRices.js, mockApi.js, filterOptions.js
├── pages/               # Home, Login, Dashboard, Submit, RiceDetail
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

Data fetching goes through `useFetch(fetcher)` only — never raw fetch/axios in
component bodies. The fetcher must be referentially stable (wrap in
`useCallback`, as in `pages/Home.jsx`).

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
