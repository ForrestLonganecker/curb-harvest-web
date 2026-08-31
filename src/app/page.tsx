"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface WhoAmI {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function Home() {
  const [user, setUser] = useState<WhoAmI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/auth/whoami`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-sm flex-col items-center gap-6 py-32 text-center">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Curb Harvest
        </h1>

        {loading ? (
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        ) : user ? (
          <>
            <p className="text-zinc-600 dark:text-zinc-400">
              Signed in as {user.email}
            </p>
            <button
              onClick={handleLogout}
              className="rounded-full border border-solid border-black/[.08] px-5 py-2.5 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              Sign out
            </button>
          </>
        ) : (
          <a
            href={`${API_URL}/auth/google`}
            className="rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign in with Google
          </a>
        )}
      </main>
    </div>
  );
}
