# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (http://localhost:3000)
npm run build        # production build
npm run lint         # ESLint

# Database
npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma generate                    # regenerate client after schema changes
npx prisma studio                      # GUI to inspect DB

# Data pipeline (run once in order on a fresh DB)
npx prisma db seed             # import ~87k movies from dataset/ml-32m.zip
npm run import-tmdb-ids        # backfill tmdbId from links.csv
npm run fetch-posters          # enrich movies with TMDB posters/metadata

# TypeScript check (tsc is broken in PATH; use the local binary)
./node_modules/typescript/bin/tsc --noEmit
```

`prisma/seed.ts`, `scripts/*.ts`, and the Prisma seed entry all use `tsconfig.node.json` (sets `module: CommonJS`), not the main `tsconfig.json`.

## Architecture

**Rule: Server Components call Prisma directly. Client Components call `/api/` routes.**

Never fetch `http://localhost:3000/api/...` from a Server Component — call Prisma directly instead. The API routes exist solely for client-side mutations and the random-movie button.

### Data flow

```
Browser
 ├─ Server Components (pages)
 │   ├─ src/app/movies/page.tsx          → prisma.movie.findMany()
 │   ├─ src/app/movies/[id]/page.tsx     → prisma.movie.findUnique() + getServerSession()
 │   └─ src/app/profile/page.tsx         → prisma.rating.findMany()  [auth-gated]
 │
 └─ Client Components
     ├─ RatingForm       → POST /api/ratings  (then router.refresh() to revalidate)
     ├─ RandomMovieButton → GET /api/movies/random  (then router.push)
     └─ MovieFilters     → updates URL search params, page re-fetches
```

### Auth

NextAuth v4 with **JWT strategy** (no database sessions, no Prisma adapter needed).

- Config lives in `src/lib/auth.ts` (`authOptions`) — imported everywhere including the route handler.
- `session.user.id` is populated via JWT callback; the type extension is in `src/types/next-auth.d.ts`.
- Server-side auth check: `getServerSession(authOptions)` — use this in Server Components and Route Handlers.
- Client-side: `useSession()` hook from `next-auth/react`.
- Profile page redirects to `/login?callbackUrl=/profile` if unauthenticated.
- API routes return 401 if no session.

### Database

Three models: **User**, **Movie**, **Rating**.

Key constraints:
- `Rating` has `@@unique([userId, movieId])` — use `prisma.rating.upsert()` (not create) when submitting ratings.
- `Movie.mlMovieId` is `@unique` — the MovieLens integer ID.
- `Movie.genres` and `Movie.cast` are PostgreSQL `String[]` arrays — filter with `{ genres: { has: "Drama" } }`.

Scores: `mlAvgScore` stores the MovieLens community average normalised to 1–10 (original 0.5–5.0 × 2). `Rating.score` is the app user's 1–10 integer score.

### Zod version note

This project uses **Zod v4**. Use `.issues` not `.errors` on `ZodError` (e.g. `parsed.error.issues[0].message`).

## Environment variables

Both `.env` (read by Prisma CLI and ts-node scripts) and `.env.local` (read by Next.js) must be kept in sync.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | JWT signing key |
| `NEXTAUTH_URL` | Base URL for NextAuth callbacks |
| `TMDB_API_KEY` | Used only by `scripts/fetch-posters.ts` |

## Dataset pipeline

`dataset/ml-32m.zip` is the MovieLens 32M dataset (not committed to git). The seed script extracts it to `/tmp/ml32m` on first run and is idempotent. Re-seeding requires `npx prisma migrate reset` first.

The enrichment scripts (`import-tmdb-ids`, `fetch-posters`) are resumable — re-running them skips already-processed rows.
