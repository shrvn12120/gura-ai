import { CATEGORY_META_CONFIGS, getListingsById } from "@/app/action";
import ListingForm, { ListingFormData } from "@/components/admin/ListingForm";
import { Spinner } from "@/components/ui/spinner";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

async function EditListingPage({ params }: EditPageProps) {
  

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
    public_access: rawListing.public_access,
    publicPassword: "", // Passwords are not stored in plaintext, so we can't pre-fill this field
  };
  return(
     

           <div className='w-full'>
          <ListingForm initialData={preparedData} categories={x}/>
          </div>
        
       

    )
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="w-full">
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-row items-center justify-center py-8 ">
        <p className="animate-pulse">Loading...</p>
        <Spinner />
        </div>
        </div>
    }>
       <EditListingPage params={params}/>
      </Suspense>
    </main>
  );
}