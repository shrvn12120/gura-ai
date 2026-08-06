import MetaConfigTable from "@/components/admin/meta-config/DataTable";
import { db } from "@/lib/db";
import MetaConfig from "@/models/MetaConfig";
import { Suspense } from "react";

// async function migrate(){

//   try {

//     console.log("Connecting MongoDB...");

//     await connectDB();


//     console.log("Reading MetaConfig documents...");


//     const configs =
//       await MetaConfig.find().lean();


//     console.log(
//       `Found ${configs.length} configs`
//     );


//     for(const config of configs){


//       await db.query(
//         `
//         INSERT INTO meta_configs
//         (
//           category,
//           sub_categories
//         )

//         VALUES

//         (
//           $1,
//           $2
//         )

//         ON CONFLICT(category)
//         DO UPDATE SET

//           sub_categories = EXCLUDED.sub_categories,

//           updated_at = NOW()

//         `,
//         [
//           config.category,

//           JSON.stringify(
//             config.subCategories ?? []
//           )
//         ]
//       );


//       console.log(
//         `Migrated: ${config.category}`
//       );

//     }


//     console.log(
//       "Migration completed successfully"
//     );


//   }

//   catch(error){

//     console.error(
//       "Migration failed:",
//       error
//     );

//   }


// }


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
