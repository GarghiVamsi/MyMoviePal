# MyMoviePal

A full-stack movie discovery and rating platform powered by the MovieLens 32M dataset (87,000+ movies), enriched with TMDB posters and metadata.

## Features

- **Browse & search** 87k+ movies with genre, year, and sort filters
- **Movie detail pages** with poster, overview, cast, director, runtime, and genre badges
- **Dual scores** — community MovieLens average alongside user ratings
- **Rate & review** any movie with a 1–10 star rating and optional text review
- **User accounts** — register, log in, and view your full ratings history on your profile
- **Surprise Me** — random movie discovery button
- **Correct title formatting** — MovieLens-format titles (e.g. "Ring, The") are displayed correctly ("The Ring")

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL on Supabase |
| ORM | Prisma 5 |
| Auth | NextAuth v4 (JWT, credentials) |
| Styling | Tailwind CSS |
| Validation | Zod v4 + React Hook Form |
| Image optimisation | Sharp + Next.js Image |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (or access to the shared project credentials)
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)

### Setup

```bash
git clone https://github.com/GarghiVamsi/MyMoviePal.git
cd MyMoviePal
npm install
cp .env.example .env
```

Fill in `.env` with your credentials:

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require"
TMDB_API_KEY=""
NEXTAUTH_SECRET=""   # generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

```bash
npx prisma generate   # generate Prisma client from schema
npm run dev           # start dev server at http://localhost:3000
```

> The database (87k+ movies with posters) is already live on Supabase — no migrations or seeding needed.

## Project Structure

```
src/
├── app/
│   ├── (auth)/login & register    # Auth pages
│   ├── api/                       # REST API routes
│   ├── movies/[id]/               # Movie detail page
│   ├── movies/                    # Browse/search page
│   ├── profile/                   # User ratings history
│   └── layout.tsx                 # Root layout
├── components/
│   ├── auth/                      # LoginForm, RegisterForm
│   ├── layout/                    # Navbar
│   ├── movies/                    # MovieCard, MovieGrid, RatingForm, RatingsList
│   └── ui/                        # Badge, Button, Input, StarRating, Spinner
├── lib/
│   ├── auth.ts                    # NextAuth config
│   ├── prisma.ts                  # Prisma singleton
│   ├── utils.ts                   # formatTitle, formatScore, cn helpers
│   └── validations.ts             # Zod schemas
└── types/                         # Shared TypeScript types
```

## Architecture

- **Server Components** fetch data directly via Prisma — no redundant API calls
- **Client Components** interact with `/api/` routes for mutations (ratings, auth)
- `DATABASE_URL` uses the Supabase connection pooler (port 6543) for runtime
- `DIRECT_URL` uses the direct Supabase connection (port 5432) for `prisma migrate` only

## Deployment

This app is designed to deploy on [Vercel](https://vercel.com). Set the following environment variables in your Vercel project dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase pooler URL |
| `DIRECT_URL` | Supabase direct URL |
| `TMDB_API_KEY` | Your TMDB API key |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your Vercel deployment URL (e.g. `https://mymoviepal.vercel.app`) |
