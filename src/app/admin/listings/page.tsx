import ListingsTable from "@/components/list-table";
import connectDB from "@/lib/mongodb";
import listingModel from "@/models/listing.model";

export default async function page() {
  await connectDB();

  const listings = await listingModel.find({"islandId": "6a2b3316882b534c9d608058"})
    .sort({ createdAt: -1 })
    .lean();

  if (listings.length === 0) {
    return (
      <div className="space-y-6 w-full min-h-screen flex items-center justify-center">
        <div className="w-1/2 py-10 bg-card rounded-2xl flex items-center justify-center">
          <p className="text-muted-foreground">There is no data</p>
        </div>
      </div>
    );
  }

  const data = JSON.parse(JSON.stringify(listings));

  return (
    <div className="space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold">Listings</h1>
        <p className="text-muted-foreground">Manage all island listings</p>
      </div>

      <ListingsTable listings={data} />
    </div>
  );
}