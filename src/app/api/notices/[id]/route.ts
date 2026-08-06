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
 const origin = req.headers.get("origin");
    const isAllowedOrigin = process.env.NODE_ENV === "development" ? origin ==="http://localhost:3000" : origin ==="https://ai.devemm.com";
    
    if(!isAllowedOrigin) {
      return Response.json(
        {
          error: "Your not authorized to access this API endpoint contact emm",
        },
        {
          status: 403,
        }
      );
    }
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
    const origin = req.headers.get("origin");
    const isAllowedOrigin = process.env.NODE_ENV === "development" ? origin ==="http://localhost:3000" : origin ==="https://ai.devemm.com";
    
    if(!isAllowedOrigin) {
      return Response.json(
        {
          error: "Your not authorized to access this API endpoint contact emm",
        },
        {
          status: 403,
        }
      );
    }

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