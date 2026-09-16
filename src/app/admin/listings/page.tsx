import ListingsClient from "@/components/admin/ListDashboard";
import { CATEGORY_META_CONFIGS } from "@/app/action";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { Spinner } from "@/components/ui/spinner";

export async function getListings() {
  const result = await db.query(
    `
    SELECT *
    FROM listings
    ORDER BY created_at DESC
    `,
  );

  return result.rows;
}

async function Informations() {
  await connection();

  const pg = await getListings();

  const serializedListings = pg.map((item: any) => ({
    ...item,
    _id: item.id.toString(),
  }));

  const x = await CATEGORY_META_CONFIGS();

  return <ListingsClient categories={x} listings={serializedListings} />;
}

export default function Page() {
  return (
    <main className="w-full">
      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="flex flex-row items-center justify-center py-8 ">
              <p className="animate-pulse">Loading...</p>
              <Spinner />
            </div>
          </div>
        }
      >
        <Informations />
      </Suspense>
    </main>
  );
}
