// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongodb";
// import MetaConfig from "@/models/MetaConfig";
// import { z } from "zod";
// import { revalidatePath } from "next/cache";

// const CreateMetaConfigSchema = z.object({
//   category: z.string().min(2, "Category is required"),

//   subCategories: z
//     .array(
//       z.object({
//         name: z.string(),
//         fields: z.array(z.any()).default([]),
//       }),
//     )
//     .optional(),
// });

// // GET ALL CATEGORIES

// export async function GET(req: NextRequest) {
//   try {
//     const origin = req.headers.get("origin");
//     const isAllowedOrigin = process.env.NODE_ENV === "development" ? origin ==="http://localhost:3000" : origin ==="https://ai.devemm.com";

//     if(!isAllowedOrigin) {
//       return Response.json(
//         {
//           error: "Your not authorized to access this API endpoint contact emm",
//         },
//         {
//           status: 403,
//         }
//       );
//     }

//     await connectDB();

//     const configs = await MetaConfig.find().sort({
//       createdAt: -1,
//     });

//     return NextResponse.json(configs);
//   } catch (error) {
//     return NextResponse.json(
//       {
//         message: "Failed to fetch meta configs",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }

// // CREATE CATEGORY

// export async function POST(req: NextRequest) {
//   try {
//      const origin = req.headers.get("origin");
//     const isAllowedOrigin = process.env.NODE_ENV === "development" ? origin ==="http://localhost:3000" : origin ==="https://ai.devemm.com";

//     if(!isAllowedOrigin) {
//       return Response.json(
//         {
//           error: "Your not authorized to access this API endpoint contact emm",
//         },
//         {
//           status: 403,
//         }
//       );
//     }
//     await connectDB();

//     const body = await req.json();

//     const validated = CreateMetaConfigSchema.parse(body);

//     const exists = await MetaConfig.findOne({
//       category: validated.category,
//     });

//     if (exists) {
//       return NextResponse.json(
//         {
//           message: "Category already exists",
//         },
//         {
//           status: 409,
//         },
//       );
//     }

//     const config = await MetaConfig.create({
//       category: validated.category,

//       subCategories: validated.subCategories ?? [],
//     });

//     revalidatePath("/admin", "layout")
//     revalidatePath("/", "layout")

//     return NextResponse.json(config, {
//       status: 201,
//     });
//   } catch (error: any) {
//     if (error.name === "ZodError") {
//       return NextResponse.json(
//         {
//           message: error.errors,
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     return NextResponse.json(
//       {
//         message: error.message ?? "Something went wrong",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

const CreateMetaConfigSchema = z.object({
  category: z.string().min(2, "Category is required"),

  subCategories: z
    .array(
      z.object({
        name: z.string(),

        fields: z.array(z.any()).default([]),
      }),
    )
    .optional(),
});

// GET ALL CATEGORIES

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");

    const isAllowedOrigin =
      process.env.NODE_ENV === "development"
        ? origin === "http://localhost:3000"
        : origin === "https://ai.devemm.com";

    if (!isAllowedOrigin) {
      return NextResponse.json(
        {
          error: "Your not authorized to access this API endpoint contact emm",
        },
        {
          status: 403,
        },
      );
    }

    const result = await db.query(
      `
SELECT *
FROM meta_configs
ORDER BY created_at DESC
`,
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch meta configs",
      },
      {
        status: 500,
      },
    );
  }
}

// CREATE CATEGORY

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");

    const isAllowedOrigin =
      process.env.NODE_ENV === "development"
        ? origin === "http://localhost:3000"
        : origin === "https://ai.devemm.com";

    if (!isAllowedOrigin) {
      return NextResponse.json(
        {
          error: "Your not authorized to access this API endpoint contact emm",
        },
        {
          status: 403,
        },
      );
    }

    const body = await req.json();

    const validated = CreateMetaConfigSchema.parse(body);

    /*
Check duplicate category
*/

    const exists = await db.query(
      `
SELECT id
FROM meta_configs
WHERE category=$1
`,
      [validated.category],
    );

    if (exists.rows.length) {
      return NextResponse.json(
        {
          message: "Category already exists",
        },
        {
          status: 409,
        },
      );
    }

    /*
Create category
*/

    const result = await db.query(
      `

INSERT INTO meta_config
(
category,
sub_categories
)

VALUES
(
$1,
$2::jsonb
)

RETURNING *

`,
      [validated.category, JSON.stringify(validated.subCategories ?? [])],
    );

    revalidatePath("/admin", "layout");

    revalidatePath("/", "layout");

    return NextResponse.json(
      result.rows[0],

      {
        status: 201,
      },
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          message: error.errors,
        },
        {
          status: 400,
        },
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        message: error.message ?? "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
}
