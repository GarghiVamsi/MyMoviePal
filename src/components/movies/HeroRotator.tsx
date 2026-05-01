"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatTitle, stripHtml } from "@/lib/utils";

type HeroItem = {
  id: string;
  title: string;
  overview: string;
  posterUrl: string | null;
  bannerImage: string | null;
  contentType: string;
  genres: string[];
  year: number | null;
};

export function HeroRotator({ items }: { items: HeroItem[] }) {
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (items.length <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      5_000
    );
  }, [items.length]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  const prev = useCallback(() => {
    stop();
    setIdx((i) => (i - 1 + items.length) % items.length);
    start();
  }, [stop, start, items.length]);

  const next = useCallback(() => {
    stop();
    setIdx((i) => (i + 1) % items.length);
    start();
  }, [stop, start, items.length]);

  if (!items.length) return null;

  const item = items[idx];
  const isAnime = item.contentType === "anime";

  return (
    <div
      className="relative h-[85vh] min-h-[580px] overflow-hidden"
      onMouseEnter={stop}
      onMouseLeave={start}
    >
      {/* Background poster crossfade — anchored right so portrait posters show naturally */}
      {items.map((it, i) => {
        const heroSrc = it.bannerImage ?? it.posterUrl;
        if (!heroSrc) return null;
        const src = heroSrc.replace("/t/p/w500", "/t/p/w1280");
        const isBanner = !!it.bannerImage;
        return (
          <Image
            key={it.id}
            src={src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover transition-opacity duration-1000 motion-reduce:transition-none ${
              isBanner ? "object-center" : it.contentType === "anime" ? "object-center" : "object-right-top"
            } ${i === idx ? "opacity-100" : "opacity-0"}`}
          />
        );
      })}

      {/* Dark overlays — heavy left coverage keeps text readable, right shows poster art */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950 from-20% via-gray-950/70 via-40% to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-transparent to-transparent" />

      {/* Left / right nav arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full pb-10 px-4 sm:px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Content type badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm mb-4">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isAnime ? "bg-violet-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`text-xs font-bold uppercase tracking-[0.2em] ${
                  isAnime ? "text-violet-400" : "text-amber-400"
                }`}
              >
                {isAnime ? "Anime" : "Movie"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl font-black uppercase leading-[0.95] tracking-tight mb-3 max-w-3xl text-white">
              {formatTitle(item.title)}
            </h1>

            {/* Genres + year */}
            <div className="flex flex-wrap gap-2 mb-4">
              {item.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-sm border border-white/20 text-xs font-bold uppercase tracking-wider text-gray-300"
                >
                  {g}
                </span>
              ))}
              {item.year && (
                <span className="px-2 py-0.5 rounded-sm border border-white/20 text-xs font-bold uppercase tracking-wider text-gray-400">
                  {item.year}
                </span>
              )}
            </div>

            {/* Overview */}
            {item.overview && (
              <p className="text-gray-300 text-base mb-6 max-w-xl leading-relaxed line-clamp-3">
                {stripHtml(item.overview)}
              </p>
            )}

            {/* CTA */}
            <Link
              href={`/movies/${item.id}`}
              className="inline-flex items-center gap-2 px-7 py-3 bg-amber-500 text-black font-black uppercase tracking-wider text-sm hover:bg-amber-400 transition-colors mb-8"
            >
              VIEW DETAILS
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex gap-2 items-center">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { stop(); setIdx(i); start(); }}
              aria-label={`Go to item ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                i === idx
                  ? "w-8 bg-amber-400"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
