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
├── .env.example          # MONGODB_URI, PORT
├── .env                  # gitignored
├── server.js             # Entry: load env, connect DB, mount routes, error handler
├── config/
│   └── db.js             # mongoose.connect() with event logging
├── models/
│   └── Rice.js           # Mongoose schema + model
├── routes/
│   └── rices.js          # CRUD router
├── middleware/
│   └── errorHandler.js   # Centralized error → { success: false, error }
├── seeds/
│   └── seed.js           # Clears + inserts seed rices
└── scripts/
    └── mongo.sh          # Podman start/stop helper
```

### API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rices` | List with search, filter, sort, pagination |
| `GET` | `/api/rices/:id` | Get single rice (increments views) |
| `POST` | `/api/rices` | Create rice |
| `PUT` | `/api/rices/:id` | Update rice |
| `DELETE` | `/api/rices/:id` | Delete rice |
| `GET` | `/api/health` | Health check |

Response envelope: `{ success: boolean, data?, error? }`

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
HTTP calls to the backend API at `http://localhost:5000/api`. Response envelope
contract: always `{ success, data?, error? }`.

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

- **Auth** — `{ user, login(user), logout() }`. `user` is `null` or
  `{ handle, name, avatar }`. Mock-only until Exp 6 (JWT): `Login.jsx` derives
  a handle from the submitted identifier and redirects to `/dashboard`.
  Mirrored to `sessionStorage['ricehub.user']` — survives reloads, forgotten
  when the tab closes. No route guards yet; protected routes and roles are
  Exp 6 scope.
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

REST under `/api/*`; envelope `{ success, data?, error? }`. JWT auth
(`Authorization: Bearer`), `authMiddleware`, and `requireOwnerOrAdmin` are
Exp 5/6 scope — never trust client-sent `author`/`role` until then.
