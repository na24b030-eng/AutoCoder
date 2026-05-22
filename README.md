---

## Tech Stack

| | AutoCoder | Generated Apps |
|---|---|---|
| AI | OpenRouter (`openrouter/free`) | — |
| Frontend | React + Vite + Tailwind | React + Vite + Tailwind |
| Backend | Node.js + Express | Node.js + Express |
| Database | SQLite (better-sqlite3) | SQLite (better-sqlite3) |
| Hosting (frontend) | Vercel | Vercel |
| Hosting (backend) | Render | Render |

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate` | Start a generation. Body: `{ prompt }` |
| `GET` | `/api/generations` | List all past generations |
| `GET` | `/api/generations/:id` | Poll status of a specific generation |
| `GET` | `/api/debug` | Check which env vars are set |

---

## Environment Variables

```env
OPENROUTER_API_KEY=     # openrouter.ai → Keys
GITHUB_TOKEN=           # GitHub → Settings → Developer Settings → PAT (repo scope)
VERCEL_TOKEN=           # vercel.com/account/tokens
RENDER_API_KEY=         # render.com → Account Settings → API Keys
RENDER_OWNER_ID=        # GET https://api.render.com/v1/owners → owner.id (starts with tea-)
PORT=3001
NODE_ENV=development
```