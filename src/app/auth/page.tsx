// import React from 'react'

// type Props = {}

// const page = (props: Props) => {
//   return (
//     <div>page</div>
//   )
// }

// export default page

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answer }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      alert("Wrong answer");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={login}
        className="w-full max-w-sm space-y-4 rounded-xl border p-6"
      >
        <h1 className="text-2xl font-bold">Admin Login</h1>

        <label className="block text-sm">
          Question
          <div className="mt-1 rounded bg-muted p-3">
            What is our favorite island?
          </div>
        </label>

        <input
          className="w-full rounded border px-3 py-2"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Answer"
        />

        <button
          disabled={loading}
          className="w-full rounded bg-black py-2 text-white"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}