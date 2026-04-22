"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface WatchlistButtonProps {
  movieId: string;
  initialSaved: boolean;
}

export function WatchlistButton({ movieId, initialSaved }: WatchlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      if (saved) {
        await fetch(`/api/watchlist?movieId=${movieId}`, { method: "DELETE" });
        setSaved(false);
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieId }),
        });
        setSaved(true);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50
        ${saved
          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
        }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill={saved ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {saved ? "Saved" : "Add to Watchlist"}
    </button>
  );
}
