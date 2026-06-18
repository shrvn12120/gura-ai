import Listing from "@/models/listing.model";
import connectDB from "@/lib/mongodb";
import ListingForm from "@/components/list-form";
import { notFound } from "next/navigation";

export default async function EditListing({
  params,
}: {
  params: { id: string };
}) {
  await connectDB();

  const {id} = await params

  const res = await Listing.findById(id).lean();

  const listing = JSON.parse(JSON.stringify(res))

  if (!listing) {
    return notFound();
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <ListingForm
        mode="edit"
        initialData={{
          ...listing,
          _id: listing._id.toString(), // important for edit API
          aiTags: listing.aiTags?.join(", ") || "",
        }}
      />
    </div>
  );
}