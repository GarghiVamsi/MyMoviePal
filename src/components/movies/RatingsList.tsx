import { Rating } from "@/types";
import { StarRating } from "@/components/ui/StarRating";

interface RatingsListProps {
  ratings: Rating[];
}

export function RatingsList({ ratings }: RatingsListProps) {
  if (ratings.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No reviews yet. Be the first to rate this movie!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {ratings.map((r) => (
        <div key={r.id} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-200 text-sm">
                {r.user.name ?? r.user.email.split("@")[0]}
              </p>
              <StarRating value={r.score} onChange={() => {}} readonly size="sm" />
            </div>
            <time className="text-xs text-gray-600 shrink-0">
              {new Date(r.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          </div>
          {r.review && (
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">{r.review}</p>
          )}
        </div>
      ))}
    </div>
  );
}
