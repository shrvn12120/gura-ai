import ListingsClient from "@/components/admin/ListDashboard";
import { CATEGORY_META_CONFIGS } from "@/app/action";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";

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

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ListingsClient categories={x} listings={serializedListings} />
    </Suspense>
  );
}

export default async function Page() {
  return <Informations />;
}
