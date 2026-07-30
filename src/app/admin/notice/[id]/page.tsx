
import NoticeForm from "@/components/admin/NoticeForm";
import connectDB from "@/lib/mongodb";
import Notice, { INotice } from "@/models/Notice";

import { notFound } from "next/navigation";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNoticePage({ params }: EditPageProps) {
  const { id } = await params;
  await connectDB();

  const rawListing = await Notice.findById(id).lean();
  if (!rawListing) return notFound();

  // Convert array back into a comma-separated string for form compatibility
  const preparedData: INotice = {
  _id:rawListing._id.toString(),
  title: rawListing.title,
  message: rawListing.message,
  type: rawListing.type,
  priority: rawListing.priority,
  isActive: rawListing.isActive,

  };



  return(
      <div className='w-full'>
       <NoticeForm initialData={preparedData} />
      </div>
    )
}