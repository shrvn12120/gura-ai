import MetaConfigTable from "@/components/admin/meta-config/DataTable";
import { db } from "@/lib/db";

import { Suspense } from "react";



export async function getMetaConfigs(){

  const result = await db.query(
    `
    SELECT *
    FROM meta_configs
    `
  );
  const x = result.rows;

    const serializedListings = x.map((item: any) => ({
    ...item,
    _id: item.id.toString(),
    subCategories: item.sub_categories
  }));


  return serializedListings
}

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
