# RiceHub Plan — Experiments 5, 6 & 8 (feature commits)

> Scope note: AGENTS.md §3 says one experiment at a time. This file plans
> three experiments together for visibility, but implementation stays
> sequential — one commit per experiment, in order 5 → 6 → 8.
> Experiment 7 (per-app Dockerfiles) is intentionally omitted — low-risk.

Core non-regression principle: **additive only**. Each experiment keeps all
previously working demo flows working with valid input, and only adds
rejection/behavior for previously-unhandled invalid/unauthorized cases.

Prior working baseline that must never break:

- Exp 4: `GET /api/rices` list/search/filter/sort/paginate, `GET /:id`
  (+views), `GET /batch`, `POST/PUT/DELETE` happy paths,
  `{ success, data?, error? }` envelope, Home grid + RiceDetail + Dashboard
  load from real backend via `frontend/src/data/mockApi.js`.

Suggested commits (feature names, not experiment numbers):

1. `feat(secure-api): validate rice inputs and standardize API errors` (Exp 5)
2. `feat(auth): jwt login with owned rices and roles` (Exp 6)
3. `feat(live-comments): realtime rice comments over websockets` (Exp 8)

---

## 1. `feat(secure-api)` — Hardened validation + error handling (Exp 5)

### Demo story (showable)

Reviewer submits bad rice (empty title, bad `dotfilesUrl`,
`likes: ["hacked"]`) → gets terminal-style `> ERR:` 400s; valid submit still
works exactly as in Exp 4; unknown route returns JSON not HTML; security
headers present in devtools.

### Non-regression guarantee

All Exp 4 happy-path requests return identical shapes/statuses. Only invalid
requests that previously created junk or crashed now 400. No auth required
yet, no field renamed.

### Backend (additive)

1. `backend/package.json`: add `express-validator`, `helmet`,
   `express-rate-limit`, `express-mongo-sanitize` (no removals).
2. New `backend/middleware/validate.js`: `validate(rules)` wrapper — runs
   `validationResult`, returns `400 { success:false, error: "msg1, msg2" }`.
3. `backend/routes/rices.js` — add validation chains, keep handlers:
   - `GET /`: `page` and `limit` are **clamped** (page ≥ 1, limit 1–50,
     default 12) rather than 400ing — keeps older clients working;
     `sort` in `[NEWEST, TRENDING, TOP_ALL_TIME]`; `search` trimmed
     (still `$text`); `distro,wm,colorScheme` comma lists trimmed.
   - `GET /batch`: require `ids`, cap at 50, reject malformed ObjectIds 400.
   - `POST /`: require `title, distro, wm, dotfilesUrl`; `author` string
     trimmed ≤40 chars — **still accepted and whitelisted in Exp 5** since
     the schema requires it and auth only lands in Exp 6; `distro` enum;
     `dotfilesUrl` + each `images[]` must match `https?://`; `tags[]` max
     10, sanitize-trim/uppercase; **strip** `likes, views, status,
     createdAt` from body (whitelist the rest) — client-sent `author`
     stops being trusted from Exp 6 onward.
   - `PUT /:id`: same rules, all-optional, same strip list.
   - Fix sort bug (`'likes.length'` does not sort in Mongo): use an
     aggregation `$match` + `$addFields: { likesCount: { $size: "$likes" } }`
     and sort `likesCount` for TRENDING/TOP_ALL_TIME (or fall back to
     `{ views: -1, createdAt: -1 }`); keep response shape
     `{ rices, total, page, pages }`.
4. `backend/server.js`: add `helmet()`, `express-mongo-sanitize` (see
   note below), `rateLimit({ windowMs: 60_000, max: 30 })` on `/api/`
   (skip `/api/health`), `cors({ origin: (process.env.CORS_ORIGIN ??
   'http://localhost:5173').split(',') })`, mount new
   `middleware/notFound.js` for `/api/*` → `404 { success:false, error }`
   before `errorHandler`.
5. `backend/middleware/errorHandler.js`: add `SyntaxError` (bad JSON) → 400,
   keep `ValidationError`/`CastError` branches, never send stack.
6. `backend/.env.example`: add `CORS_ORIGIN=http://localhost:5173`.

   > `express-mongo-sanitize`: recursively strips keys starting with `$`
   > or containing `.` from `req.body`, `req.query`, and `req.params`
   > before handlers run — blocks NoSQL operator injection like
   > `{ "likes": { "$gt": "" } }` or `?distro[$ne]=`. Drop-in
   > middleware on Express 4, no config needed; we keep it.

### Frontend (display only)

- `pages/Submit.jsx`: keep `useForm` + layout; add an `author` text
  field; replace fake `setTimeout` success with real `POST` via
  `mockApi.createRice()`; render backend `error` as `> ERR:` line.
- `pages/Home.jsx`, `pages/RiceDetail.jsx`: keep `useFetch` pattern; only
  improve error rendering (show `error` string from envelope).
- `data/mockApi.js`: add `createRice/updateRice/deleteRice` helpers using same
  envelope; keep `fetchRices/fetchRiceById/fetchRicesByIds` signatures.

### Docs

Update `docs/rice-hub-design.md` validation table + error codes;
`AGENTS.md` Exp 5 → ✅ in same commit.

### Verify (must pass before commit)

- `cd frontend && npm run lint && npm run build`
- `curl` matrix: valid POST 201 (with author), missing title 400, bad URL
  400, `likes` injection ignored (response `likes: []`), `limit=999`
  clamped to 50, unknown `/api/nope` JSON 404, 31st request in a minute
  returns 429; Home/Detail/Dashboard still load.

---

## 2. `feat(auth)` — JWT accounts, ownership + roles (Exp 6)

### Demo story (showable)

Register → login → submit (author auto-filled from token) → Dashboard
"My Rices" shows only mine → logout → `/dashboard` redirects to `/login` →
second user cannot edit first user's rice (403) → like button persists.

### Non-regression guarantee

Exp 5 validation still enforced; all public reads (`GET` list/detail) remain
open and identical; Exp 4/5 demo data still viewable logged-out. Only writes
now require token; client-sent `author` is now ignored and overwritten
from the JWT (Exp 5 whitelisted it). Register/login routes validate
with `express-validator` chains (handle/email/password format+length,
identifier+password present) — this satisfies the official Exp 5
validation-on-auth-routes step.

### Backend

1. Deps: `bcryptjs`, `jsonwebtoken`.
2. New `models/User.js`: `handle` unique lowercase, `email` unique,
   `passwordHash`, `role: user|admin` default `user`, timestamps.
   `toSafeJSON()` omits hash.
3. New `routes/auth.js`:
   - `POST /api/auth/register { handle, email, password }` (validate
     length/format, 409 duplicate, hash rounds 10, sign `JWT_SECRET` `7d`,
     return `{ token, user }`).
   - `POST /api/auth/login { identifier, password }` (identifier =
     handle-or-email, `bcrypt.compare`, same return). 401 wrong password, never
     reveal which field failed.
4. New `middleware/auth.js`: `authMiddleware` (parse `Bearer`, verify,
   `req.user = { id, handle, role }`, 401 missing/invalid) +
   `requireOwnerOrAdmin(loadOwner)` (403 otherwise).
5. `routes/rices.js` rewire (keep Exp 5 validation, add auth):
   - `POST /` → `authMiddleware`, set `author = req.user.handle`.
   - `PUT/DELETE /:id` → `authMiddleware` + owner-or-admin check (load rice,
     compare `rice.author` vs `req.user.handle`, allow `role: admin`).
   - New `POST /:id/like` → `authMiddleware`, `$addToSet/$pull` current handle
     in `likes[]`, return updated rice.
   - Optional `GET /api/rices/mine` → `authMiddleware`,
     filter `author == req.user.handle`.
6. `seeds/seed.js`: create demo users + one `admin` (creds only in local
   `.env`, never commit); `.env.example` adds `JWT_SECRET`, `JWT_EXPIRES_IN`.
7. `errorHandler.js`: map `JsonWebTokenError/TokenExpiredError` → 401.

### Frontend (keep all pages, rewire state)

1. `context/AuthProvider.jsx`: state `{ user, token }` persisted to
   `sessionStorage['ricehub.user']` (keep tab-scoped convention); expose
   `login(identifier,password)`, `register(handle,email,password)`, `logout()`.
2. `data/mockApi.js`: add `loginUser, registerUser, createRice(auth),
   updateRice(auth), deleteRice(auth), toggleLike(auth), fetchMyRices(auth)`
   with `Authorization: Bearer` helper; keep old fetch signatures.
3. `pages/Login.jsx`: keep tabs + `useForm` + styling; replace mock login with
   real calls, show backend 401/409 as `> ERR:`; redirect `/dashboard`.
4. New `components/ProtectedRoute.jsx`: wraps `/dashboard`, `/submit` in
   `App.jsx`; unauth → `/login?next=...`. Public routes (`/`, `/rice/:id`)
   untouched.
5. `pages/Submit.jsx`: send token, drop `author` from payload.
6. `pages/Dashboard.jsx`: `my-rices` uses `fetchMyRices()` when logged in;
   add owner Edit/Delete buttons; `saved-rices` tab logic unchanged.
7. `pages/RiceDetail.jsx`: add Like button (filled state from
   `likes.includes(user.handle)`), keep gallery/specs/tags layout.

### Docs

Design doc adds User schema, auth flow, `Authorization: Bearer` contract, Like
endpoint; `AGENTS.md` Exp 6 → ✅.

### Verify

- lint + build.
- Flow: register 201 → login 200 → POST without token 401 → POST with token
  sets correct author → PUT by non-owner 403, by owner 200, by admin 200 →
  like toggles persist after reload.
- Playwright ad-hoc: direct `/dashboard` logged-out redirects, logged-in
  renders My Rices.

---

## 3. `feat(live-comments)` — Realtime rice comments (Exp 8)

### Demo story (showable)

Open same `/rice/:id` in two browsers, post comment in A → appears instantly
in B; logged-out user sees comments but gets login prompt on post; refresh
preserves history.

### Non-regression guarantee

Exp 6 auth + Exp 5 validation intact; comments are new UI section replacing
only the `COMMENTS_MODULE_PENDING_EXP8` placeholder in
`RiceDetail.jsx:225-236`; gallery/specs/tags/likes untouched; REST fallback
means comments work even if socket drops. Requires Exp 6 (authors are JWT
users, not stubbed).

### Backend

1. Deps: `socket.io` (v4). Frontend dep: `socket.io-client` (this commit).
2. New `models/Comment.js`: `rice` ref+index, `author` ref User (or handle
   snapshot + `authorId`), `text` required max 500 trimmed, timestamps.
3. New `routes/comments.js` (or extend `rices.js`):
   `GET /api/rices/:id/comments?limit=&before=` (paginated, chronological,
   envelope), `POST /api/rices/:id/comments` (`authMiddleware`, same text
   validation) — initial load + fallback.
4. New `realtime/comments.js` mounted from `server.js`: `io` with the
   same `CORS_ORIGIN` env for its CORS; handshake verifies `auth.token`
   via same JWT logic (reject → disconnect); events: client
   `join rice:<id>` / `leave`, `comment:send { riceId, text }` →
   validate → save → broadcast `comment:new` to room; per-socket send
   rate limit (~1/sec); render text as plain text (no HTML execution).
   HTTP `POST /api/rices/:id/comments` stays under the Exp 5 30 req/min
   limiter — that is intended throttling, documented in the design doc.
5. Keep HTTP server as source of truth: `server.js` creates `httpServer`,
   attaches `io`, still listens on `PORT`.

### Frontend

1. New `components/CommentsPanel.jsx`: props `{ riceId }`; uses
   `useFetch(getComments)` for history + `socket.io-client` for live; `join`
   on mount/`riceId` change, `leave` on unmount; `comment:new` appends (dedupe
   by `_id`); send box only when `useAuth().user` (else login link);
   optimistic add with rollback on 401/400; empty state, reconnect handling.
2. `pages/RiceDetail.jsx`: swap placeholder for
   `<CommentsPanel riceId={id} />`; no other layout changes.
3. `data/mockApi.js`: add `fetchComments(riceId)`, `postComment(riceId, text)`
   (auth header).

### Docs

Design doc adds Comment schema + socket contract (`join`, `comment:send`,
`comment:new`, auth via handshake); `AGENTS.md` Exp 8 → ✅.

### Verify

- lint + build.
- Manual two-tab live test; unauth POST/socket-send rejected; refresh shows
  persisted comments; kill socket → REST history still loads.

---

## Execution order

Implement strictly 5 → 6 → 8, one commit each, updating `AGENTS.md` +
`docs/rice-hub-design.md` in the same commit whenever schemas/contracts
change.
