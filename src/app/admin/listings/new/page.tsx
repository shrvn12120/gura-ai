import { CATEGORY_META_CONFIGS } from '@/app/action'
import ListingForm from '@/components/admin/ListingForm'


type Props = {}

const page = async (props: Props) => {
  const x = await CATEGORY_META_CONFIGS()
  return (
    <div className='w-full'>
      <ListingForm categories={x}/>
    </div>
  )
}

export default page