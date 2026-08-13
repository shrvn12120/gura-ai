import { ConversationInspectorSkeleton } from '@/components/admin/conversation-inspector-skeleton'
import React from 'react'

type Props = {}

const Loading = (props: Props) => {
  return (
     <div className="w-full min-h-screen bg-zinc-50/50 dark:bg-zinc-950  font-sans antialiased text-zinc-900 dark:text-zinc-50 mt-10">
       <div className="max-w-4xl mx-auto space-y-6"><ConversationInspectorSkeleton /></div>

    </div>
   
  )
}

export default Loading