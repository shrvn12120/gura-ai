import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";


// GET ALL ACTIVE NOTICES

export async function GET(req:NextRequest) {

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