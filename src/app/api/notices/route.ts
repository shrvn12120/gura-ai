import { NextRequest, NextResponse } from "next/server";
import connectDB  from "@/lib/mongodb";
import Notice from "@/models/Notice";


// GET ALL

export async function GET(){

    await connectDB();

    const notices = await Notice
        .find({
            isActive:true
        })
        .sort({
            createdAt:-1
        });


    return NextResponse.json(notices);
}



// CREATE

export async function POST(
    req:NextRequest
){

    await connectDB();


    const body = await req.json();


    const notice = await Notice.create(body);


    return NextResponse.json(
        notice,
        {
            status:201
        }
    );
}