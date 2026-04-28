"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Suggestion {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  contentType: string;
}

interface Props {
  defaultValue?: string;
  onSearch: (query: string) => void;
  onSubmit?: (query: string) => void;
}

export function SearchAutocomplete({ defaultValue = "", onSearch, onSubmit }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 1) { setSuggestions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/movies/suggest?q=${encodeURIComponent(query)}`);
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
      setActiveIndex(-1);
    }, 250);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        router.push(`/movies/${suggestions[activeIndex].id}`);
        setOpen(false);
      } else {
        setOpen(false);
        if (onSubmit) onSubmit(query);
        else onSearch(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }, [open, activeIndex, suggestions, query, onSearch, onSubmit, router]);

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        type="text"
        placeholder="Search movies & anime..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); onSearch(e.target.value); }}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className="h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        autoComplete="off"
      />

      {open && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
          {suggestions.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => { router.push(`/movies/${s.id}`); setOpen(false); }}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                  i === activeIndex ? "bg-gray-800" : "hover:bg-gray-800/60"
                }`}
              >
                <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded bg-gray-800">
                  {s.posterUrl ? (
                    <Image src={s.posterUrl} alt={s.title} fill className="object-cover" sizes="28px" />
                  ) : (
                    <div className="h-full w-full bg-gray-700" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-100">{s.title}</p>
                  <p className="text-xs text-gray-500">
                    {s.year ?? "—"}
                    <span className={`ml-2 rounded px-1 py-0.5 text-[10px] font-medium ${
                      s.contentType === "anime"
                        ? "bg-purple-900/60 text-purple-300"
                        : "bg-amber-900/60 text-amber-300"
                    }`}>
                      {s.contentType === "anime" ? "Anime" : "Movie"}
                    </span>
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
