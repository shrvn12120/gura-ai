import ChatUi from '@/components/chat-ui'

import  { Suspense } from 'react'
import { getNotice } from './action';

type Props = {}

 

const Chat = async (props: Props) => {
  "use cache"


 const notices = await getNotice()
  return (

      
      <ChatUi notices={notices}/>
      

  )
}



const page = async (props: Props) => {
 
  return (

      <Suspense fallback={<div>Loading....</div>}>
      <Chat/>
      </Suspense>

  )
}

export default page