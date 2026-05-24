# ⚡ AutoCoder

A multi-agent AI system that converts a plain English prompt into a fully deployed full-stack web application — live on the internet in under 10 minutes.

**Live:** https://auto-coder-sigma.vercel.app

---

## How It Works

When you submit a prompt, five specialised AI agents run in a pipeline. Each agent is responsible for one layer of the application. All agents use the OpenRouter API with automatic retry logic for rate limiting.

```
User Prompt
     │
     ▼
Orchestrator Agent → blueprint.json
     │
     ├─────────────────────┬─────────────────────┐
     ▼                     ▼                     ▼
  DB Agent          Backend Agent         Frontend Agent
 (schema.js)         (server.js)           (App.jsx)
     │                     │                     │
     └─────────────────────┴─────────────────────┘
                           │
                           ▼
                   Assembler Agent
                    (README.md)
                           │
                           ▼
                      deploy.js
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           GitHub        Vercel       Render
```

### Agent Responsibilities

| Agent | Input | Output |
|---|---|---|
| **Orchestrator** | User prompt | Blueprint JSON with project name, tables, routes, pages |
| **DB Agent** | Blueprint | `schema.js` — SQLite tables, indexes, seed data |
| **Backend Agent** | Blueprint | `server.js` — Express REST API with full CRUD |
| **Frontend Agent** | Blueprint + backend URL | `App.jsx` — React SPA with Tailwind styling |
| **Assembler** | Blueprint | `README.md` for the generated project |

DB, Backend, and Frontend agents run in **parallel** after the Orchestrator completes.

---

## Code Quality System

Both the Backend and DB agents validate their generated code before accepting it — retrying up to 4 times if validation fails.

**Backend Agent checks:**
- Required patterns present (`app.listen`, `express`, `require('./db/schema')`, `try/catch`)
- No forbidden packages (`bcrypt`, `jsonwebtoken`, `axios`, etc.)
- Balanced braces and parentheses
- Auto-fixes broken arrow function syntax before validation

**DB Agent checks:**
- Correct `better-sqlite3` initialisation
- `module.exports = db` present
- No multiple SQL statements inside a single `db.prepare()`
- No forbidden packages

**Frontend Agent:**
- Strips non-ASCII characters (smart quotes, em dashes) automatically
- Validates no forbidden package imports (`lucide-react`, `framer-motion`, etc.)
- Retries up to 3 times if validation fails

---

## Deployment Pipeline

After all agents finish, `deploy.js` handles three steps in sequence:

**1. GitHub** — creates a new public repo, pushes all 13 generated files. Repo name includes a 5-digit timestamp to prevent conflicts on retry.

**2. Vercel** — creates a project with `rootDirectory: frontend`, triggers deployment using the internal `repoId` from the creation response.

**3. Render** — creates a Node.js web service. Key API requirement: `rootDir` and `branch` must be at the top level of the request body; `buildCommand` and `startCommand` go inside `serviceDetails.envSpecificDetails`. Node.js is pinned to `20.11.1` via `.node-version` to ensure `better-sqlite3` builds correctly.

---

## Polling Architecture

Generation takes 5–8 minutes. The backend responds immediately with `{ id, status: "running" }` and processes in the background. The frontend polls `GET /api/generations/:id` every 3 seconds until status is `complete` or `failed`.

---

## Tech Stack

| | AutoCoder | Generated Apps |
|---|---|---|
| AI | OpenRouter (`openrouter/free`) | — |
| Frontend | React + Vite + Tailwind | React + Vite + Tailwind |
| Backend | Node.js + Express | Node.js + Express |
| Database | SQLite (better-sqlite3) | SQLite (better-sqlite3) |
| Frontend Deploy | Vercel | Vercel |
| Backend Deploy | Render | Render |

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate` | Start generation. Body: `{ prompt }` |
| `GET` | `/api/generations` | List all generations |
| `GET` | `/api/generations/:id` | Poll status of a generation |
| `GET` | `/api/debug` | Check environment variables |

---

## Environment Variables

```env
OPENROUTER_API_KEY=     # openrouter.ai → Keys
GITHUB_TOKEN=           # GitHub → Settings → PAT → repo scope
VERCEL_TOKEN=           # vercel.com/account/tokens
RENDER_API_KEY=         # render.com → Account Settings → API Keys
RENDER_OWNER_ID=        # GET https://api.render.com/v1/owners → id field (starts with tea-)
PORT=3001
NODE_ENV=development
```

---

## Local Setup

```bash
git clone https://github.com/na24b030-eng/autocoder
cd autocoder/backend
npm install
# add .env with variables above
npm run dev

# new terminal
cd autocoder/frontend
npm install
npm run dev
```