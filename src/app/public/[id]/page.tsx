import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import PublicListingEditor from "@/components/listings/PublicListingEditor";
import PublicListingForm from "@/components/listings/PublicListingForm";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

const ACCESS_COOKIE_PREFIX = "listing_public_";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_change_in_production"
);

async function getListingWithDraft(id: string) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const baseUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://ai.devemm.com";

    const res = await fetch(`${baseUrl}/api/public/listings/${id}`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    const data = await res.json();


    // Handle 401 unauthenticated safely so we still return listing baseline details
    if (res.status === 401) {
      return { 
        listing: data.listing ?? null, 
        draft: data.draft ?? null, 
        publicAccessDisabled: data.error === "Public access is not enabled" 
      };
    }

    if (!res.ok) {
      return { listing: null, draft: null, publicAccessDisabled: false };
    }

    return {
      listing: data.listing ?? null,
      draft: data.draft ?? null,
      publicAccessDisabled: false,
    };
  } catch (error) {
    console.error("Error fetching listing from API:", error);
    return { listing: null, draft: null, publicAccessDisabled: false };
  }
}

async function ServerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(`${ACCESS_COOKIE_PREFIX}${id}`)?.value;

  let isAuthenticated = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.listingId === id) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  const { listing, draft, publicAccessDisabled } = await getListingWithDraft(id);

  // If unauthenticated, show password prompt
  if (!isAuthenticated) {
    return (
      <main className="w-full">
        <PublicListingEditor listingId={id} />
      </main>
    );
  }

  // Handle case where public access is explicitly disabled in database
  if (publicAccessDisabled || (listing && !listing.public_access)) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          Public editing is not available for this listing.
        </div>
      </main>
    );
  }

  // Default error fallback if listing fails to load completely
  if (!listing) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          Listing not found or unavailable.
        </div>
      </main>
    );
  }
  return (
    <main className="w-full">
      <PublicListingForm
        listing={listing}
        draft={draft}
        listingId={id}
      />
    </main>
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="w-full">
      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="flex flex-row items-center justify-center py-8 gap-2">
              <p className="animate-pulse">Loading...</p>
              <Spinner />
            </div>
          </div>
        }
      >
        <ServerPage params={params} />
      </Suspense>
    </main>
  );
}