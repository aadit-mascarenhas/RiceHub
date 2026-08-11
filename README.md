# 🍚 Rice Hub

A full-stack web app for showcasing Linux desktop customizations ("rices") — screenshots, setup details, and a link to your dotfiles. Browse by distro, window manager/compositor, and color scheme; like, comment, and save your favorites.

Built as a progressive full-stack learning project (React, Node/Express, MongoDB, Docker, CI/CD).

---

## Why

Rice showcases today are scattered across Reddit (`r/unixporn`), raw GitHub repos, and a couple of static mirror sites — none of which let you submit directly, filter on structured fields, or self-host your own instance. Rice Hub is a small, structured, self-hostable take on the same idea.

---

## Features

- Browse rices in a responsive grid, filter by distro / WM / bar / launcher / color scheme
- Search by title/tags
- Submit a rice: screenshots + a link to your dotfiles GitHub repo (no file uploads/parsing — just a link, for now)
- Like, comment, and save rices to your dashboard
- JWT-based auth with per-user "My Rices" and "Saved Rices"
- Live comments via WebSockets
- Fully Dockerized — one command spins up frontend + backend + database

---

## Tech stack

**Frontend:** React · Vite · Tailwind CSS
**Backend:** Node.js · Express
**Database:** MongoDB · Mongoose
**Auth:** JWT
**Realtime:** Socket.IO
**Infra:** Docker · Docker Compose · GitHub Actions

---

## Project structure

```
rice-hub/
├── frontend/     # React app
├── backend/      # Express API
├── docker-compose.yml
└── docs/rice-hub-design.md   # full design doc (schemas, API routes, build plan)
```

---

## Getting started

### With Docker (recommended)

```bash
git clone https://github.com/<your-username>/rice-hub.git
cd rice-hub
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Without Docker

```bash
# backend
cd backend
npm install
cp .env.example .env    # fill in MONGO_URI, JWT_SECRET
npm run dev

# frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Environment variables

**backend/.env**
```
MONGO_URI=mongodb://localhost:27017/ricehub
JWT_SECRET=your_secret_here
PORT=5000
```

---

## Submitting a rice

1. Sign up / log in
2. Go to Dashboard → "Submit a Rice"
3. Add a title, description, screenshots, your distro/WM/color scheme, and a link to your dotfiles GitHub repo
4. Submit — it shows up on the homepage grid

There's no file upload or dotfiles parsing yet — just a link to your repo. See the roadmap below for what's planned.

---

## License

MIT
