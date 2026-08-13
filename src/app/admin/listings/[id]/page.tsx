import { CATEGORY_META_CONFIGS, getListingsById } from "@/app/action";
import ListingForm, { ListingFormData } from "@/components/admin/ListingForm";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditPageProps) {
  'use cache'; 

 const x = await CATEGORY_META_CONFIGS()
   const { id } = await params;


  const rawListing = await getListingsById(id);
  if (!rawListing) return notFound();

 

  // Convert array back into a comma-separated string for form compatibility
  const preparedData: ListingFormData = {
    _id: String(rawListing.id),
    title: String(rawListing.title || ""),
    slug: String(rawListing.slug || ""),
    category: String(rawListing.category || ""),
    subCategory: String(rawListing.subcategory || ""),
    description: String(rawListing.description || ""),
    contact_info: rawListing.contact_info,
    active: rawListing.active,
    images: rawListing.images,
    metadata: (rawListing.metadata as Record<string, any>) || {},
  };
  return(
     
        <Suspense>
           <div className='w-full'>
          <ListingForm initialData={preparedData} categories={x}/>
          </div>
        </Suspense>
       

    )
}