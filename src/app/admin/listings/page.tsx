
import connectDB from "@/lib/mongodb";
import Listing from "@/models/Listing";

import ListingsClient from "@/components/admin/ListDashboard";

export default async function ListingsPage() {
  await connectDB();

  const listings = await Listing.find()
    .sort({ createdAt: -1 })
    .lean();

  const serializedListings = listings.map((item: any) => ({
    ...item,
    _id: item._id.toString(),
  }));

    return <ListingsClient listings={serializedListings} />;

}