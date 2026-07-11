import ChatUi from '@/components/chat-ui'
import connectDB from '@/lib/mongodb';
import Notice from '@/models/Notice';
import React, { Suspense } from 'react'

type Props = {}

 async function getNotice(){

    await connectDB();

    const res = await Notice
        .find({
            isActive:true
        })
        .sort({
            createdAt:-1
        });
if(!res){
  return []
}

const data = res.map((res)=>{
  return {
    _id: res._id.toString(),
    message: res.message,
    type: res.type,
    title: res.title
  }
})

    return data;
}

const page = async (props: Props) => {
  const notices = await getNotice()
  return (
    <div>
      <Suspense fallback={<div>Loading....</div>}>
      <ChatUi notices={notices}/>
      </Suspense>
    </div>
  )
}

export default page