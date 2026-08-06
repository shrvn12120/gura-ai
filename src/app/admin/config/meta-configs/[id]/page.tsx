import { getMetaConfigById } from "@/app/action";
import MetaMasterForm from "@/components/admin/meta-config/MetaMasterForm";
import { MetaConfig } from "@/components/admin/meta-config/types";

interface Props {
  params: Promise<{ id: string }>;
}

const page = async ({ params }: Props) => {
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
};

export default page;
