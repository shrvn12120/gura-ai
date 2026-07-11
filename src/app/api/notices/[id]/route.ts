import { NextRequest, NextResponse } from "next/server";
import connectDB  from "@/lib/mongodb";
import Notice from "@/models/Notice";



// UPDATE

export async function PATCH(
    req:NextRequest,
    {
        params
    }:{
        params:{
            id:string
        }
    }
){

    await connectDB();

    const { id }= await params
    const body = await req.json();



    const notice =
        await Notice.findByIdAndUpdate(
            id,
            body,
            {
                new:true
            }
        );


    return NextResponse.json(notice);
}



// DELETE

export async function DELETE(
    req:NextRequest,
    {
        params
    }:{
        params:{
            id:string
        }
    }
){

    await connectDB();


    await Notice.findByIdAndDelete(
        params.id
    );


    return NextResponse.json({
        success:true
    });
}