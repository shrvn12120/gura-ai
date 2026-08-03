import ListingsClient from "@/components/admin/ListDashboard";
import { CATEGORY_META_CONFIGS } from "@/app/action";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";

import connectDB from "@/lib/mongodb";
import Listing from "@/models/Listing";



// async function migrateListings() {

//   try {

//     console.log("Connecting MongoDB...");

//     await connectDB();


//     console.log("Clearing old PostgreSQL listings...");

//     await db.query(`
//       DELETE FROM listings;
//     `);


//     console.log("Reading MongoDB listings...");

//     const listings =
//       await Listing.find().lean();


//     console.log(
//       `Found ${listings.length} listings`
//     );


//     for (const listing of listings) {


//       await db.query(
//         `
//         INSERT INTO listings
//         (
//           title,
//           slug,
//           category,
//           subcategory,
//           description,
//           contact_info,
//           images,
//           metadata,
//           active,
//           searchable_text,
//           embedding,
//           created_at,
//           updated_at
//         )

//         VALUES

//         (
//           $1,
//           $2,
//           $3,
//           $4,
//           $5,
//           $6,
//           $7,
//           $8,
//           $9,
//           $10,
//           $11,
//           $12,
//           $13
//         )

//         ON CONFLICT(slug)
//         DO UPDATE SET
//           title = EXCLUDED.title,
//           slug = EXCLUDED.slug,
//           category = EXCLUDED.category,
//           subcategory = EXCLUDED.subcategory,
//           description = EXCLUDED.description,
//           contact_info = EXCLUDED.contact_info,
//           images = EXCLUDED.images,
//           metadata = EXCLUDED.metadata,
//           active = EXCLUDED.active,
//           searchable_text = EXCLUDED.searchable_text,
//           embedding = EXCLUDED.embedding,
//           updated_at = NOW()

//         `,

//         [

//           listing.title,

//           listing.slug,

//           listing.category,

//           listing.subCategory ?? "default",

//           listing.description ?? "",


//           JSON.stringify(
//             listing.contact_info ?? {}
//           ),


//           JSON.stringify(
//             listing.images ?? []
//           ),


//           JSON.stringify(
//             listing.metadata ?? {}
//           ),


//           listing.active ?? false,


//           listing.searchableText ?? "",


//           listing.embedding?.length
//   ? `[${listing.embedding.join(",")}]`
//   : null,


//           listing.createdAt ?? new Date(),


//           listing.updatedAt ?? new Date()

//         ]
//       );


//       console.log(
//         "Migrated:",
//         listing.title
//       );

//     }


//     console.log(
//       "Migration completed!"
//     );


//   } catch(error) {

//     console.error(
//       "Migration error:",
//       error
//     );

//   }

// }














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
  // await migrateListings()

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ListingsClient categories={x} listings={serializedListings} />
    </Suspense>
  );
}

export default async function Page() {
  return <Informations />;
}
