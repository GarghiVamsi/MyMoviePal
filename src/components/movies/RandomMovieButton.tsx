"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function RandomMovieButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/movies/random");
      if (!res.ok) return;
      const movie = await res.json();
      router.push(`/movies/${movie.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6l2 2h8v14H4V4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2 2-2 2M8 8L6 10l2 2" />
        </svg>
      )}
      Surprise Me
    </Button>
  );
}
