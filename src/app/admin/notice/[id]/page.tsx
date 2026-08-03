
import { getNoticeById } from "@/app/action";
import NoticeForm from "@/components/admin/NoticeForm";
import { INotice } from "@/models/Notice";

import { notFound } from "next/navigation";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNoticePage({ params }: EditPageProps) {
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