"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchAutocomplete } from "@/components/movies/SearchAutocomplete";

export function HeroSearch() {
  const router = useRouter();
  const queryRef = useRef("");

  function navigate() {
    if (queryRef.current) router.push(`/movies?q=${encodeURIComponent(queryRef.current)}`);
    else router.push("/movies");
  }

  return (
    <div className="flex w-full max-w-lg mb-8">
      <SearchAutocomplete
        onSearch={(q) => { queryRef.current = q; }}
        onSubmit={navigate}
      />
      <button
        type="button"
        onClick={navigate}
        className="h-11 px-6 bg-amber-500 text-sm font-black uppercase tracking-wider text-black hover:bg-amber-400 transition-colors shrink-0"
      >
        SEARCH
      </button>
    </div>
  );
}
