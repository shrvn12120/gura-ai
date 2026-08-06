// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";

// export default function LoginPage() {
//   const [answer, setAnswer] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   async function login(e: React.ChangeEvent) {
//     e.preventDefault();
//     setLoading(true);

//     const res = await fetch("/api/login", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ answer }),
//     });
//     const {message} = await res.json()

//     setLoading(false);

//     if (res.ok) {
//       router.push("/admin");
//       router.refresh();
//     } else {
     
//       toast(message);
//     }
//   }

//   return (
//     <main className="min-h-screen flex items-center justify-center">
//       <form
//         onSubmit={login}
//         className="w-full max-w-sm space-y-4 rounded-xl border p-6"
//       >
//         <h1 className="text-2xl font-bold">Admin Login</h1>

//         <label className="block text-sm">
//           Question
//           <div className="mt-1 rounded bg-muted p-3">
//             What is our favorite island?
//           </div>
//         </label>

//         <input
//           className="w-full rounded border px-3 py-2"
//           value={answer}
//           onChange={(e) => setAnswer(e.target.value)}
//           placeholder="Answer"
//           type="password"
//           autoComplete="off"
//         />

//         <button
//           disabled={loading}
//           className="w-full rounded bg-black py-2 text-white"
//         >
//           {loading ? "Signing in..." : "Sign In"}
//         </button>
//       </form>
//     </main>
//   );
// }
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer }),
      });
      const { message } = await res.json();

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        toast.error(message || "Invalid credentials");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="answer">Question</Label>
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground font-medium">
                What is our favorite island?
              </div>
            </div>

            <div className="space-y-2">
              <Input
                id="answer"
                placeholder="Answer"
                type="password"
                autoComplete="off"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}