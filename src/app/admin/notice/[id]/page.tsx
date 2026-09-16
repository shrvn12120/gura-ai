import { getNoticeById } from "@/app/action";
import NoticeForm from "@/components/admin/NoticeForm";
import { Spinner } from "@/components/ui/spinner";
import { INotice } from "@/types";


import { notFound } from "next/navigation";
import { Suspense } from "react";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

 async function EditNoticePage({ params }: EditPageProps) {
  const { id } = await params;


  const rawListing = await getNoticeById(id);
  if (!rawListing) return notFound();

  // Convert array back into a comma-separated string for form compatibility
  const preparedData: INotice = {
  id:rawListing.id,
  title: rawListing.title,
  message: rawListing.message,
  type: rawListing.type,
  priority: rawListing.priority,
  is_active: rawListing.is_active,

  };



  return(
      <div className='w-full'>
       <NoticeForm initialData={preparedData} />
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
       <EditNoticePage params={params}/>
      </Suspense>
    </main>
  );
}