import { CATEGORY_META_CONFIGS } from '@/app/action'
import ListingForm from '@/components/admin/ListingForm'
import { Suspense } from 'react'


type Props = {}

async function MetaConfigs(){

   const x = await CATEGORY_META_CONFIGS()
  return(
<div className='w-full'>
      
      <ListingForm categories={x}/>
      
    </div>
  )
}

const page = async (props: Props) => {
 
  return (
    <Suspense fallback={<p>Loading....</p>}>
    <MetaConfigs />
    </Suspense>
  )
}

export default page