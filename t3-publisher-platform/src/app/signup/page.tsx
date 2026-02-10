"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { api } from "~/trpc/react";

export default function SignupPage() {
  const router = useRouter();
  const register = api.auth.register.useMutation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "PUBLISHER",
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await register.mutateAsync(form);

      // Auto login after signup
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (res?.error) {
        setError("Registered, but login failed. Please login manually.");
        router.push("/login");
        return;
      }

      router.push(form.role === "PUBLISHER" ? "/publisher/dashboard" : "/feed");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form onSubmit={onSubmit} className="w-full space-y-4 rounded-xl border p-6">
        <h1 className="text-2xl font-semibold">Create account</h1>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />

        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />

        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Password (min 6 chars)"
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        />

        <select
          className="w-full rounded-md border px-3 py-2"
          value={form.role}
          onChange={(e) =>
            setForm((p) => ({ ...p, role: e.target.value as "USER" | "PUBLISHER" }))
          }
        >
          <option value="USER">User</option>
          <option value="PUBLISHER">Publisher</option>
        </select>

        <button
          type="submit"
          disabled={register.isPending}
          className="w-full rounded-md bg-black px-3 py-2 text-white disabled:opacity-60"
        >
          {register.isPending ? "Creating..." : "Sign up"}
        </button>

        <p className="text-sm">
          Already have an account?{" "}
          <a className="underline" href="/login">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
