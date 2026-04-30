import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatTitle, formatScore } from "@/lib/utils";
import { MotionDiv } from "@/components/ui/Motion";
import { HeroRotator } from "@/components/movies/HeroRotator";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "MyMoviePal — Discover Movies & Anime" };

async function fetchFeatured() {
  const movieSkip = Math.floor(Math.random() * 300);
  const animeSkip = Math.floor(Math.random() * 200);
  const currentYear = new Date().getFullYear();
  const [animePool, moviePool, heroMovies, heroAnime, reviewPool] = await Promise.all([
    prisma.movie.findMany({
      where: { contentType: "anime", mlAvgScore: { not: null }, mlRatingCount: { gt: 50 }, posterUrl: { not: null }, year: { gte: currentYear - 1 } },
      orderBy: { mlAvgScore: "desc" },
      take: 20,
      select: { id: true, title: true, year: true, posterUrl: true, mlAvgScore: true, genres: true, mlRatingCount: true },
    }),
    prisma.movie.findMany({
      where: { contentType: "movie", mlAvgScore: { not: null }, mlRatingCount: { gt: 50 }, posterUrl: { not: null }, year: { gte: currentYear - 1 } },
      orderBy: { mlAvgScore: "desc" },
      take: 20,
      select: { id: true, title: true, year: true, posterUrl: true, mlAvgScore: true, genres: true, mlRatingCount: true },
    }),
    prisma.movie.findMany({
      where: { contentType: "movie", overview: { not: "" }, posterUrl: { not: null }, mlRatingCount: { gt: 100 } },
      orderBy: { mlRatingCount: "desc" },
      skip: movieSkip,
      take: 5,
      select: { id: true, title: true, overview: true, posterUrl: true, bannerImage: true, contentType: true, genres: true, year: true },
    }),
    prisma.movie.findMany({
      where: { contentType: "anime", overview: { not: "" }, posterUrl: { not: null }, mlRatingCount: { gt: 100 } },
      orderBy: { mlRatingCount: "desc" },
      skip: animeSkip,
      take: 5,
      select: { id: true, title: true, overview: true, posterUrl: true, bannerImage: true, contentType: true, genres: true, year: true },
    }),
    prisma.rating.findMany({
      where: { review: { not: null }, score: { gte: 8 } },
      orderBy: { score: "desc" },
      take: 20,
      select: {
        score: true,
        review: true,
        user: { select: { name: true } },
        movie: { select: { id: true, title: true, posterUrl: true, genres: true, year: true, contentType: true } },
      },
    }),
  ]);
  // Shuffle pools and take 4 so each page load shows a different set
  const topAnime = animePool.sort(() => Math.random() - 0.5).slice(0, 4);
  const topMovies = moviePool.sort(() => Math.random() - 0.5).slice(0, 4);
  const topReviews = reviewPool.sort(() => Math.random() - 0.5).slice(0, 4);
  // Interleave movies and anime so the rotator alternates between both
  const heroPool = heroMovies.flatMap((m, i) => (heroAnime[i] ? [m, heroAnime[i]] : [m]));
  return { topAnime, topMovies, heroPool, topReviews };
}

function fmtCount(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export default async function HomePage() {
  const { topAnime, topMovies, heroPool, topReviews } = await fetchFeatured();

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── HERO ── */}
      <HeroRotator items={heroPool} />

      {/* ── TOP ANIME CONTENT ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">
              <span className="text-white">TOP </span>
              <span className="text-amber-400">ANIME</span>
              <span className="text-white"> THIS YEAR</span>
            </h2>
          </div>
          <Link href="/movies?type=anime" className="px-5 py-2.5 border border-gray-700 text-sm font-bold uppercase tracking-wider text-gray-300 hover:border-amber-500 hover:text-amber-400 transition-colors">
            VIEW ALL ANIME
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topAnime.map((item, i) => (
            <MotionDiv key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
              <TopContentCard item={item} />
            </MotionDiv>
          ))}
        </div>
      </section>

      {/* ── TOP MOVIE CONTENT ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">
              <span className="text-white">TOP </span>
              <span className="text-amber-400">MOVIES</span>
              <span className="text-white"> THIS YEAR</span>
            </h2>
          </div>
          <Link href="/movies?type=movie" className="px-5 py-2.5 border border-gray-700 text-sm font-bold uppercase tracking-wider text-gray-300 hover:border-amber-500 hover:text-amber-400 transition-colors">
            VIEW ALL MOVIES
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topMovies.map((item, i) => (
            <MotionDiv key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
              <TopContentCard item={item} />
            </MotionDiv>
          ))}
        </div>
      </section>

      {/* ── COMMUNITY REVIEWS ── */}
      {topReviews.length > 0 && (
        <section className="border-y border-gray-800/60 py-16 bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black uppercase tracking-tight">
                <span className="text-white">COMMUNITY </span>
                <span className="text-amber-400">REVIEWS</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {topReviews.map((r, i) => (
                <MotionDiv key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                  <CommunityReviewCard review={r} />
                </MotionDiv>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BROWSE CTAs ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <BrowseCard
            href="/movies?type=movie"
            label="87,000+ Films"
            title="MOVIES"
            description="From classics to blockbusters. Filter by genre, year, and rating."
            accentFrom="from-amber-600"
            accentTo="to-orange-700"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            }
          />
        </MotionDiv>
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <BrowseCard
            href="/movies?type=anime"
            label="10,000+ Series"
            title="ANIME"
            description="Discover series and films. Find your next obsession."
            accentFrom="from-violet-600"
            accentTo="to-purple-700"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            }
          />
        </MotionDiv>
      </section>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

type TopItem = {
  id: string; title: string; year: number | null;
  posterUrl: string | null; mlAvgScore: number | null;
  genres: string[]; mlRatingCount: number | null;
};

// ── Top Content Card (like TOP GAMES) ──────────────────────────────────────

function TopContentCard({ item }: { item: TopItem }) {
  const genre = item.genres[0] ?? "FILM";
  return (
    <Link href={`/movies/${item.id}`} className="group block relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors cursor-pointer">
      <div className="relative aspect-[2/3] w-full bg-gray-800">
        {item.posterUrl && (
          <Image src={item.posterUrl} alt={item.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider rounded-sm">
          {genre}
        </span>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-black uppercase text-white truncate leading-snug group-hover:text-amber-300 transition-colors">
          {formatTitle(item.title)}
        </h3>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-500">{fmtCount(item.mlRatingCount)} ratings</span>
          {item.mlAvgScore != null && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              {formatScore(item.mlAvgScore)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Community Review Card ──────────────────────────────────────────────────

type ReviewEntry = {
  score: number;
  review: string | null;
  user: { name: string | null };
  movie: { id: string; title: string; posterUrl: string | null; genres: string[]; year: number | null; contentType: string };
};

function CommunityReviewCard({ review: r }: { review: ReviewEntry }) {
  const genre = r.movie.genres[0] ?? (r.movie.contentType === "anime" ? "ANIME" : "FILM");
  return (
    <Link href={`/movies/${r.movie.id}`} className="group block">
      {/* Poster card with score badge */}
      <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-gray-600 transition-colors">
        <div className="relative aspect-[2/3] w-full bg-gray-800">
          {r.movie.posterUrl && (
            <Image src={r.movie.posterUrl} alt={r.movie.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
          )}
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider rounded-sm">
            {genre}
          </span>
          <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-sm text-amber-400 text-xs font-black">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            {r.score}/10
          </span>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-black uppercase text-white truncate leading-snug group-hover:text-amber-300 transition-colors">
            {formatTitle(r.movie.title)}
          </h3>
          {r.movie.year && <p className="text-xs text-gray-500 mt-0.5">{r.movie.year}</p>}
        </div>
      </div>
      {/* Review quote */}
      {r.review && (
        <p className="mt-3 text-sm text-gray-400 italic leading-relaxed line-clamp-3">
          &ldquo;{r.review}&rdquo;
        </p>
      )}
      {r.user.name && (
        <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">— {r.user.name}</p>
      )}
    </Link>
  );
}

// ── Browse CTA Card ────────────────────────────────────────────────────────

function BrowseCard({ href, label, title, description, accentFrom, accentTo, icon }: {
  href: string; label: string; title: string; description: string;
  accentFrom: string; accentTo: string; icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="group relative flex flex-col justify-between rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 p-8 hover:border-gray-600 transition-all duration-300 min-h-[200px] cursor-pointer">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentFrom} ${accentTo}`} />
      <div>
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${accentFrom} ${accentTo} text-white mb-4 shadow-lg`}>
          {icon}
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">{label}</p>
        <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2 group-hover:text-amber-300 transition-colors">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-300 group-hover:text-white transition-colors">
        EXPLORE NOW
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 translate-x-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </Link>
  );
}
