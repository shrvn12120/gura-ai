
import connectDB from "@/lib/mongodb";
import Listing from "@/models/Listing";

import ListingsClient from "@/components/admin/ListDashboard";
import { CATEGORY_META_CONFIGS } from "@/app/action";
import { Suspense } from "react";

 async function Informations() {
  "use cache"
  await connectDB();

  const listings = await Listing.find()
    .sort({ createdAt: -1 })
    .lean();

  const serializedListings = listings.map((item: any) => ({
    ...item,
    _id: item._id.toString(),
  }));

  const x = await CATEGORY_META_CONFIGS()

    return(
      <Suspense fallback={<p>Loading...</p>}>
        <ListingsClient categories={x} listings={serializedListings} />
      </Suspense>
    );

}

export default async function Page(){  return( <Informations />)}