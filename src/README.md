# src/

Your application code lives here. What's inside this directory is up to your team — the course does not prescribe a framework. Common patterns:

- **Full-stack TypeScript:** Next.js / SvelteKit / Remix app with API routes in the same project
- **Split frontend + backend:** `src/frontend/` (React/Vue/Svelte) and `src/backend/` (FastAPI/Django/Express/Go)
- **Monorepo:** `src/web/`, `src/api/`, `src/ml/`, `src/shared/` if you prefer clear separation

Some structural suggestions that tend to keep things sane:

- Put a `README.md` at the top of `src/` (this file, update it) explaining the structure once you settle on it
- Keep frontend and backend code separable — the moderator UI and product UI should not be the same codebase if you can avoid it, but can share a `shared/` package for types
- Don't check secrets, `.env` files, or model weights into `src/` — use `.gitignore`
- Lock dependencies (`package-lock.json`, `poetry.lock`, `uv.lock`, `go.sum`, etc.)

Teaching staff will read the repo directly — write code and comments with that audience in mind.
