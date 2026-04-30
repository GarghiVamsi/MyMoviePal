"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchAutocomplete } from "@/components/movies/SearchAutocomplete";

const navLinkClass =
  "relative px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors duration-200 hover:text-white group cursor-pointer";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={navLinkClass}>
      {children}
      <span className="absolute bottom-0.5 left-3 right-3 h-px scale-x-0 bg-amber-400 transition-transform duration-200 group-hover:scale-x-100 motion-reduce:transition-none" />
    </Link>
  );
}

function BrowseMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { label: "All", href: "/movies" },
    { label: "Movies", href: "/movies?type=movie" },
    { label: "Anime", href: "/movies?type=anime" },
  ] as const;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`${navLinkClass} flex items-center gap-1`}
      >
        Browse
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3 w-3 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <span className="absolute bottom-0.5 left-3 right-3 h-px scale-x-0 bg-amber-400 transition-transform duration-200 group-hover:scale-x-100 motion-reduce:transition-none" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-40 rounded-lg border border-gray-800 bg-gray-900 shadow-xl overflow-hidden z-50">
          {items.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-amber-400 hover:bg-gray-800 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NavSearch() {
  const router = useRouter();
  const queryRef = useRef("");

  const navigate = useCallback(() => {
    if (queryRef.current) router.push(`/movies?q=${encodeURIComponent(queryRef.current)}`);
    else router.push("/movies");
  }, [router]);

  return (
    <div className="hidden sm:flex items-center w-56">
      <SearchAutocomplete
        onSearch={(q) => { queryRef.current = q; }}
        onSubmit={navigate}
      />
      <button
        type="button"
        onClick={navigate}
        aria-label="Search"
        className="h-11 px-3 bg-amber-500 text-black hover:bg-amber-400 transition-colors shrink-0 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
      </button>
    </div>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 motion-reduce:transition-none ${
        scrolled
          ? "border-gray-800 bg-gray-950/80 backdrop-blur-md shadow-lg shadow-black/20"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-lg transition-opacity duration-200 hover:opacity-80 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <span className="text-white">MyMovie<span className="text-amber-400">Pal</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <BrowseMenu />
          {session && (
            <>
              <NavLink href="/profile">My Ratings</NavLink>
              <NavLink href="/watchlist">Watchlist</NavLink>
            </>
          )}
          <div className="ml-4 flex items-center gap-4">
            {session ? (
              <>
                <span className="text-xs text-gray-500 hidden md:block uppercase tracking-wider">
                  {session.user.name ?? session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="px-5 py-2 bg-amber-500 text-black text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-colors">
                  Join Free
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform duration-200 motion-reduce:transition-none ${menuOpen ? "rotate-90" : "rotate-0"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 motion-reduce:transition-none ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="border-t border-gray-800 bg-gray-950/95 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
          <Link href="/movies" onClick={() => setMenuOpen(false)} className="py-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-amber-400 transition-colors">All</Link>
          <Link href="/movies?type=movie" onClick={() => setMenuOpen(false)} className="py-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-amber-400 transition-colors">Movies</Link>
          <Link href="/movies?type=anime" onClick={() => setMenuOpen(false)} className="py-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-amber-400 transition-colors">Anime</Link>
          {session && (
            <>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="py-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-amber-400 transition-colors">My Ratings</Link>
              <Link href="/watchlist" onClick={() => setMenuOpen(false)} className="py-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-amber-400 transition-colors">Watchlist</Link>
            </>
          )}
          <div className="pt-2 border-t border-gray-800 mt-1 flex flex-col gap-2">
            {session ? (
              <>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{session.user.email}</p>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors cursor-pointer text-left">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="py-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-amber-400 transition-colors">Sign In</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="py-2 px-4 bg-amber-500 text-black text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-colors text-center">Join Free</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
