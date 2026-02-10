"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
     const res = (await signIn("credentials", {
  email,
  password,
  redirect: false,
  callbackUrl: "/redirect",
})) as unknown as { error?: string | null; ok?: boolean; url?: string | null };

if (res?.error) {
  setError("Invalid email or password");
  setLoading(false);
  return;
}

// نجاح: روح للرابط اللي رجعه أو لصفحة معينة
window.location.href = res?.url ?? "/redirect";
    } catch (err) {
      setError("An error occurred during login");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full space-y-4 rounded-xl border p-6"
      >
        <h1 className="text-2xl font-semibold">Login</h1>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-3 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="/signup" className="font-medium text-black hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}