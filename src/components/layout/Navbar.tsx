"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/movies" className="flex items-center gap-2 font-bold text-lg text-white hover:text-amber-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          MyMoviePal
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/movies" className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors">
            Browse
          </Link>
          {session && (
            <Link href="/profile" className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors">
              My Ratings
            </Link>
          )}
          <div className="ml-2 flex items-center gap-2">
            {session ? (
              <>
                <span className="text-sm text-gray-500 hidden md:block">
                  {session.user.name ?? session.user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/movies" })}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-gray-800 bg-gray-950 px-4 py-3 flex flex-col gap-1">
          <Link href="/movies" onClick={() => setMenuOpen(false)} className="py-2 text-sm text-gray-300 hover:text-amber-400">
            Browse Movies
          </Link>
          {session && (
            <Link href="/profile" onClick={() => setMenuOpen(false)} className="py-2 text-sm text-gray-300 hover:text-amber-400">
              My Ratings
            </Link>
          )}
          <div className="pt-2 border-t border-gray-800 mt-1 flex flex-col gap-2">
            {session ? (
              <>
                <p className="text-xs text-gray-500">{session.user.email}</p>
                <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/movies" })}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
