"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Loader2, ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PublicListingEditor({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function authenticate() {
    if (!password.trim()) {
      setError("Please enter the password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/public/listings/${listingId}/access`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Invalid password.");
        return;
      }

      // Refresh server components to re-run server cookie authentication check
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle>Listing Access</CardTitle>
          <CardDescription>
            Enter the password provided by the administrator to update this listing.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  authenticate();
                }
              }}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button
            className="w-full"
            disabled={loading || !password.trim()}
            onClick={authenticate}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Continue
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}