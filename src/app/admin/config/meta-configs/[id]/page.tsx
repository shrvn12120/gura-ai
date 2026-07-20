import MetaMasterForm from "@/components/admin/meta-config/MetaMasterForm";
import { MetaConfig, } from "@/components/admin/meta-config/types";

interface Props {
  params: Promise<{ id: string }>;
}

const page = async ({ params }: Props) => {
      const { id } = await params;
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/meta-configs/${id}`)
      const data = await res.json()

      const meta: MetaConfig= {
        _id: data._id,
        category: data.category,
        subCategories: data.subCategories
      }


  return (
    <div className="w-full">
        <MetaMasterForm initialData={meta} />
    </div>
  )
}

export default page