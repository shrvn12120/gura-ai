import ListingForm, { ListingFormData } from "@/components/admin/ListingForm";
import connectDB from "@/lib/mongodb";
import Listing from "@/models/Listing";
import { notFound } from "next/navigation";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditPageProps) {
  const { id } = await params;
  await connectDB();

  const rawListing = await Listing.findById(id).lean();
  if (!rawListing) return notFound();

  // Convert array back into a comma-separated string for form compatibility
  const preparedData: ListingFormData = {
    _id: String(rawListing._id),
    title: String(rawListing.title || ""),
    slug: String(rawListing.slug || ""),
    category: String(rawListing.category || ""),
    subCategory: String(rawListing.subCategory || ""),
    description: String(rawListing.description || ""),
    contact_info: {
      address: String(rawListing.contact_info.address || ""),
      email: String(rawListing.contact_info?.email || ""),
      phone: String(rawListing.contact_info?.phone || ""),
      whatsapp: String(rawListing.contact_info?.whatsapp || ""),
      socials: Array.isArray(rawListing.contact_info?.socials) ? rawListing.contact_info.socials : [],
      coordinates: {
        lat: String(rawListing.contact_info.coordinates.lat || 0),
        lng: String(rawListing.contact_info.coordinates.lng || 0),
      }

    },

    images: rawListing.images,
    metadata: (rawListing.metadata as Record<string, any>) || {},
  };



  return(
      <div className='w-full'>
       <ListingForm initialData={preparedData} />
      </div>
    )
}