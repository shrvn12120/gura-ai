import { getMetaConfigs } from "@/app/action";
import MetaConfigTable from "@/components/admin/meta-config/DataTable";
import { Suspense } from "react";



export default async function Page() {
  const configs = await getMetaConfigs();

  return (
  
      <Suspense fallback={<p>Loading....</p>}>
         <div className="w-full">
<MetaConfigTable data={configs} />
         </div>
   
      </Suspense>

  );
}
