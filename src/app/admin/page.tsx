// src/app/admin/page.tsx

import IslandForm from "@/components/island-form";
import connectDB from "@/lib/mongodb";
import islandModel from "@/models/island.model";
import listingModel from "@/models/listing.model";

export default async function AdminHome() {
    await connectDB();
  
    const listings = await listingModel.find({"islandId": "6a2b3316882b534c9d608058"})
      .sort({ createdAt: -1 })
      .lean();
const islandData = await islandModel.findById("6a2b3316882b534c9d608058")

const island = JSON.parse(JSON.stringify(islandData))


  return (
    <div className="min-h-screen">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card title="Listings" value={listings.length} />
        <Card title="Active" value={listings.filter((list)=> list.isActive).length} />
        <Card title="Island" value={island.name} />
      </div>

<div className="w-full flex items-center justify-center my-10">



      <IslandForm island={island} />
      </div>
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}