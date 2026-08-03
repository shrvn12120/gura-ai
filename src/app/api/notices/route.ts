// import { NextRequest, NextResponse } from "next/server";
// import connectDB  from "@/lib/mongodb";
// import Notice from "@/models/Notice";
// import { revalidatePath } from "next/cache";


// // GET ALL

// export async function GET(){

//     await connectDB();

//     const notices = await Notice
//         .find({
//             isActive:true
//         })
//         .sort({
//             createdAt:-1
//         });


//     return NextResponse.json(notices);
// }



// // CREATE

// export async function POST(
//     req:NextRequest
// ){

//     await connectDB();


//     const body = await req.json();


//     const notice = await Notice.create(body);
//     revalidatePath("/admin/notice")
//     revalidatePath("/")

//     return NextResponse.json(
//         notice,
//         {
//             status:201
//         }
//     );
// }

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";


// GET ALL ACTIVE NOTICES

export async function GET() {

  try {

    const result = await db.query(
      `
      SELECT
        id,
        title,
        message,
        type,
        priority,
        is_active,
        created_at AS "createdAt",
        updated_at AS "updatedAt"

      FROM notices

      WHERE is_active = true

      ORDER BY created_at DESC
      `
    );


    return NextResponse.json(
      result.rows
    );


  } catch(error:any){

    console.error(error);

    return NextResponse.json(
      {
        error:error.message
      },
      {
        status:500
      }
    );

  }

}



// CREATE NOTICE

export async function POST(
  req:NextRequest
){

  try {

    const body = await req.json();


    const result = await db.query(
      `
      INSERT INTO notices
      (
        title,
        message,
        type,
        priority,
        is_active
      )

      VALUES

      (
        $1,
        $2,
        $3,
        $4,
        $5
      )

      RETURNING
        id,
        title,
        message,
        type,
        priority,
        is_active,
        created_at AS "createdAt",
        updated_at AS "updatedAt"

      `,
      [

        body.title,

        body.message,

        body.type ?? "info",

        body.priority ?? "medium",

        body.isActive ?? true

      ]
    );


    revalidatePath("/admin/notice");

    revalidatePath("/");


    return NextResponse.json(
      result.rows[0],
      {
        status:201
      }
    );


  } catch(error:any){

    console.error(error);

    return NextResponse.json(
      {
        error:error.message
      },
      {
        status:500
      }
    );

  }

}