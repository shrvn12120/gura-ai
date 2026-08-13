import { redirect } from "next/navigation";
import { getActiveNotices } from "../action";
import { Suspense } from "react";
import { connection } from "next/server";
import NoticeCarousel from "@/components/notice-carousel";

type Props = {};

async function Informations() {
  await connection();
  const notices = await getActiveNotices();
  if (!notices) redirect("/");

  return (
    <div className="w-full flex items-center justify-center">

      <NoticeCarousel notices={notices} />
 
    </div>
  );
}

const page = async (props: Props) => {
  return (
    <Suspense fallback={<p>Loading....</p>}>
      <Informations />
    </Suspense>
  );
};

export default page;
