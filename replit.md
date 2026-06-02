# MPPS MCQ Tester

An MCQ (Multiple Choice Question) examination platform for MP Public School, Mathuranagar — with dedicated portals for Students, Teachers, and Principals.

## Run & Operate

- `PORT=5000 pnpm --filter @workspace/mpps-mcq-tester run dev` — run the frontend (port 5000)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5001+)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (optional, app uses Firebase)
- Required env: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` — Firebase config

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS 4 + Wouter routing
- Auth/DB/Storage: Firebase (Auth, Firestore, Storage)
- API: Express 5 (optional backend layer)
- DB: PostgreSQL + Drizzle ORM (optional, Firebase is primary)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle for API), Vite (frontend)

## Where things live

- `artifacts/mpps-mcq-tester/` — React frontend SPA
- `artifacts/mpps-mcq-tester/src/lib/firebase.ts` — Firebase initialization (source of truth for Firebase config)
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/db/` — Drizzle ORM schema and DB connection
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod schemas

## Architecture decisions

- Firebase is the primary production backend (Auth, Firestore, Storage) — the Express API server is an optional layer
- Monorepo managed with pnpm workspaces and a shared catalog for dependency versions
- Frontend runs on port 5000 (set via `PORT=5000` env prefix in the workflow command)
- Static deployment: `pnpm --filter @workspace/mpps-mcq-tester run build` → `artifacts/mpps-mcq-tester/dist`

## Product

- **Student portal**: Take MCQ exams, view results and history
- **Teacher portal**: Create and manage MCQ tests, view student results
- **Principal portal**: Oversight of all tests and results across the school

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Firebase build scripts (`@firebase/util`, `protobufjs`) are flagged by pnpm's `approve-builds` safety check — they are safe to ignore as warnings; the app builds fine without approving them
- Always prefix the dev command with `PORT=5000` so Vite binds to the Replit webview port

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
