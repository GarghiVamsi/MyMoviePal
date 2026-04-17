import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In — MyMoviePal" };

export default function LoginPage({ searchParams }: { searchParams: { registered?: string } }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/movies" className="inline-flex items-center gap-2 font-bold text-xl text-white mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            MyMoviePal
          </Link>
          <h1 className="text-2xl font-bold text-gray-100">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>
        {searchParams.registered && (
          <div className="mb-4 rounded-lg bg-green-900/40 border border-green-800 px-4 py-3 text-sm text-green-400">
            Account created! Sign in below.
          </div>
        )}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
