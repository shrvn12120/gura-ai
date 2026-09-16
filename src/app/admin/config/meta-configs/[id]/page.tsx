import { getMetaConfigById } from "@/app/action";
import MetaMasterForm from "@/components/admin/meta-config/MetaMasterForm";
import { MetaConfig } from "@/components/admin/meta-config/types";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

async function EditPage({ params }: Props) {
  

 const { id } = await params;
  const data = await getMetaConfigById(id);
  const meta: MetaConfig = {
    id: data.id,
    category: data.category,
    sub_categories: data.sub_categories,
  };

  return (
    <div className="w-full">
      <MetaMasterForm initialData={meta} />
    </div>
  );
}
const page =  ({ params }: Props) => {
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
       <EditPage params={params}/>
      </Suspense>
    </main>
  )
 
};

export default page;
