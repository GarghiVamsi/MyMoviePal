"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface RatingFormProps {
  movieId: string;
  existingRating?: { score: number; review: string | null } | null;
}

export function RatingForm({ movieId, existingRating }: RatingFormProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [score, setScore] = useState(existingRating?.score ?? 0);
  const [review, setReview] = useState(existingRating?.review ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 text-center">
        <p className="text-gray-400 text-sm">
          <a href="/login" className="text-amber-400 hover:underline font-medium">Sign in</a>{" "}
          to rate this movie
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (score === 0) {
      setError("Please select a rating");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId, score, review: review || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/ratings?movieId=${movieId}`, { method: "DELETE" });
      setScore(0);
      setReview("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
      <h3 className="font-semibold text-gray-100">
        {existingRating ? "Update your rating" : "Rate this movie"}
      </h3>
      <StarRating value={score} onChange={setScore} size="lg" />
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Write a review (optional)..."
        rows={3}
        className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? <Spinner className="h-4 w-4" /> : (existingRating ? "Update" : "Submit Rating")}
        </Button>
        {existingRating && (
          <Button type="button" variant="danger" size="md" onClick={handleDelete} disabled={loading}>
            Remove
          </Button>
        )}
      </div>
    </form>
  );
}
