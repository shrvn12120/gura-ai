import { getAllConversationHistory } from '@/app/action'
import { ConversationsTable } from '@/components/admin/conversations-table'
import { ConversationsTableSkeleton } from '@/components/admin/conversations-table-skeleton'
import { notFound } from 'next/navigation'
import React, { Suspense } from 'react'

type Props = {}

const Information = async()=>{
const conversations = await getAllConversationHistory()
if(!conversations) notFound()
return(
    <div className='w-6xl'>
    <ConversationsTable conversations={conversations} />
    </div>
)
}

const page = async (props: Props) => {
  return (
    <Suspense fallback={
        <div className='w-6xl'>
    <ConversationsTableSkeleton rowCount={10} />
    </div>}>
       <Information />
    </Suspense>
  )
}

export default page