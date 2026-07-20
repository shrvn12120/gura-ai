import { getMetaConfigs } from "@/app/action";
import MetaConfigTable from "@/components/admin/meta-config/DataTable";
import { cacheLife, cacheTag } from "next/cache";






export default async function Page(){
  const configs = await getMetaConfigs();




  return (
<div className="w-full">
   <MetaConfigTable data={configs} />
</div>
 
  )

}