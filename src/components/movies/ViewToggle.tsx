"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ViewToggle({ view }: { view: "list" | "grid" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggle = (v: "list" | "grid") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.push(`/movies?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 rounded-lg bg-gray-800 p-1">
      <button
        onClick={() => toggle("list")}
        aria-label="List view"
        className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => toggle("grid")}
        aria-label="Grid view"
        className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      </button>
    </div>
  );
}
