export function MovieCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl bg-gray-900 p-3 animate-pulse">
      <div className="w-24 shrink-0 rounded-lg bg-gray-800 aspect-[2/3]" />
      <div className="flex flex-1 gap-4">
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-800 rounded-md w-3/4" />
          <div className="h-3 bg-gray-800 rounded-md w-1/4" />
          <div className="flex gap-1 mt-3">
            <div className="h-5 bg-gray-800 rounded-md w-16" />
            <div className="h-5 bg-gray-800 rounded-md w-14" />
          </div>
          <div className="space-y-1.5 mt-3">
            <div className="h-3 bg-gray-800 rounded-md w-full" />
            <div className="h-3 bg-gray-800 rounded-md w-5/6" />
            <div className="h-3 bg-gray-800 rounded-md w-4/6" />
          </div>
        </div>
        <div className="w-28 shrink-0 border-l border-gray-800 pl-4 flex flex-col items-center justify-center gap-2">
          <div className="h-6 bg-gray-800 rounded-md w-12" />
          <div className="h-3 bg-gray-800 rounded-md w-16" />
        </div>
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ view = "list" }: { view?: "list" | "grid" }) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}
