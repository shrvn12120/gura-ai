import MetaConfigTable from "@/components/admin/meta-config/DataTable";
import { Spinner } from "@/components/ui/spinner";
import { db } from "@/lib/db";

import { Suspense } from "react";

export async function getMetaConfigs() {
  const result = await db.query(
    `
    SELECT *
    FROM meta_configs
    `,
  );
  const x = result.rows;

  const serializedListings = x.map((item: any) => ({
    ...item,
    _id: item.id.toString(),
    subCategories: item.sub_categories,
  }));

  return serializedListings;
}

async function MetaConfigs() {
  const configs = await getMetaConfigs();

  return (
    <div className="w-full">
      <MetaConfigTable data={configs} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={ <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-row items-center justify-center py-8 ">
        <p className="animate-pulse">Loading...</p>
        <Spinner />
        </div>
        </div>}>
      <div className="w-full">
        <MetaConfigs />
      </div>
    </Suspense>
  );
}
