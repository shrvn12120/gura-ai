import ListingsTable from "@/components/list-table";
import connectDB from "@/lib/mongodb";
import Listing from "@/models/listing.model";


export default async function ListingsPage() {
  await connectDB();

  const listings = await Listing.find()
    .sort({ createdAt: -1 })
    .lean();

  const data = JSON.parse(JSON.stringify(listings));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Listings</h1>
        <p className="text-muted-foreground">
          Manage all island listings
        </p>
      </div>

      <ListingsTable listings={data} />
    </div>
  );
}