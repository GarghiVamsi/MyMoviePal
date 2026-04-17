"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema, RegisterInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setServerError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      setServerError(json.error ?? "Registration failed");
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="name"
        label="Name"
        placeholder="Your name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        id="password"
        type="password"
        label="Password"
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : "Create Account"}
      </Button>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-400 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
