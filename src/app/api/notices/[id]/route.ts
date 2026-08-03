// import { NextRequest, NextResponse } from "next/server";
// import connectDB  from "@/lib/mongodb";
// import Notice from "@/models/Notice";
// import { revalidatePath } from "next/cache";
// type RouteContext = {
//   params: Promise<{ id: string }>;
// };




// export async function PATCH(
//   req: NextRequest,
//   context: RouteContext
// ) {
//   try {
//     // 1. Ensure the database is connected
//     await connectDB();

//     // 2. Await your params (Required in Next.js 15+)
//     const { id } = await context.params;
    
//     // 3. Check if the ID was provided
//     if (!id) {
//       return NextResponse.json({ error: "Missing notice ID" }, { status: 400 });
//     }

//     // 4. Safely parse the body payload
//     const body = await req.json();

//     // 5. Update the document in MongoDB
//     const notice = await Notice.findByIdAndUpdate(
//       id,
//       body,
//       {
//         new: true,          // Returns the modified document instead of the original
//         runValidators: true // Ensures the body matches your Mongoose schema rules
//       }
//     );

//     // 6. Handle cases where the ID doesn't exist in your database
//     if (!notice) {
//       return NextResponse.json({ error: "Notice not found" }, { status: 404 });
//     }

//        revalidatePath("/admin/notice")
//     revalidatePath("/")

//     // 7. Return the updated document
//     return NextResponse.json(notice);

//   } catch (error: any) {
//     console.error("PATCH Error:", error);
//     return NextResponse.json(
//       { error: error.message || "Internal Server Error" }, 
//       { status: 500 }
//     );
//   }
// }



// // DELETE

// export async function DELETE(
//   req: NextRequest,
//   context: RouteContext
// ) {
//   try {
//     // 1. Establish database connection
//     await connectDB();

//     // 2. Await the asynchronous params (Mandatory in Next.js 15)
//     const { id } = await context.params;

//     // 3. Fallback check for missing ID
//     if (!id) {
//       return NextResponse.json({ error: "Missing resource ID" }, { status: 400 });
//     }

//     // 4. Delete the document from MongoDB
//     const deletedNotice = await Notice.findByIdAndDelete(id);

//     // 5. Handle cases where the document was already gone
//     if (!deletedNotice) {
//       return NextResponse.json({ error: "Notice not found" }, { status: 404 });
//     }

//     // 6. Return successful status
//     return NextResponse.json({ success: true });

//   } catch (error: any) {
//     console.error("DELETE Error:", error);
//     return NextResponse.json(
//       { error: error.message || "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";


type RouteContext = {
  params: Promise<{ id: string }>;
};



// UPDATE NOTICE

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {

  try {

    const { id } = await context.params;


    if (!id) {
      return NextResponse.json(
        { error: "Missing notice ID" },
        { status: 400 }
      );
    }


    const body = await req.json();


    const result = await db.query(
      `
      UPDATE notices

      SET

        title = COALESCE($1, title),

        message = COALESCE($2, message),

        type = COALESCE($3, type),

        priority = COALESCE($4, priority),

        is_active = COALESCE($5, is_active),

        updated_at = NOW()


      WHERE id = $6


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

        body.type,

        body.priority,

        body.isActive,

        id

      ]
    );


    if(result.rows.length === 0){

      return NextResponse.json(
        {
          error:"Notice not found"
        },
        {
          status:404
        }
      );

    }


    revalidatePath("/admin/notice");
    revalidatePath("/");


    return NextResponse.json(
      result.rows[0]
    );


  }
  catch(error:any){

    console.error(
      "PATCH Error:",
      error
    );


    return NextResponse.json(
      {
        error:error.message || "Internal Server Error"
      },
      {
        status:500
      }
    );

  }

}





// DELETE NOTICE

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {

  try {

    const { id } = await context.params;


    if(!id){

      return NextResponse.json(
        {
          error:"Missing resource ID"
        },
        {
          status:400
        }
      );

    }


    const result = await db.query(
      `
      DELETE FROM notices

      WHERE id=$1

      RETURNING id
      `,
      [
        id
      ]
    );


    if(result.rows.length === 0){

      return NextResponse.json(
        {
          error:"Notice not found"
        },
        {
          status:404
        }
      );

    }


    revalidatePath("/admin/notice");
    revalidatePath("/");


    return NextResponse.json(
      {
        success:true
      }
    );


  }
  catch(error:any){

    console.error(
      "DELETE Error:",
      error
    );


    return NextResponse.json(
      {
        error:error.message || "Internal Server Error"
      },
      {
        status:500
      }
    );

  }

}