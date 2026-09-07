
import SessionsTable from '@/components/admin/conversations-table'
import { ConversationsTableSkeleton } from '@/components/admin/conversations-table-skeleton'

import  { Suspense } from 'react'

type Props = {}

const Information = async()=>{
return(
    <div className='w-full'>
    <SessionsTable  />
    </div>
)
}

const page = async (props: Props) => {
  return (
    <Suspense fallback={
        <div className='w-full'>
    <ConversationsTableSkeleton rowCount={10} />
    </div>}>
       <Information />
    </Suspense>
  )
}

export default page