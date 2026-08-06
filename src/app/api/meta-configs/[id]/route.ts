// import { NextRequest, NextResponse } from "next/server";

// import connectDB from "@/lib/mongodb";

// import MetaConfig from "@/models/MetaConfig";

// import { z } from "zod";
// import { revalidatePath } from "next/cache";

// const UpdateSchema = z.object({
//   action: z.enum([
//     "ADD_SUBCATEGORY",
//     "UPDATE_SUBCATEGORY",
//     "DELETE_SUBCATEGORY",
//     "UPDATE_CATEGORY",
//     "REPLACE_SUBCATEGORIES",
//   ]),

//   data: z.any(),
// });

// // GET SINGLE CATEGORY

// export async function GET(
//   req: Request,
//   {
//     params,
//   }: {
//     params: Promise<{ id: string }>;
//   },
// ) {
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
//     const { id } = await params;

//     await connectDB();

//     const config = await MetaConfig.findById(id);

//     if (!config) {
//       return NextResponse.json(
//         {
//           message: "Not found",
//         },
//         {
//           status: 404,
//         },
//       );
//     }

//     return NextResponse.json(config);
//   } catch (error) {
//     return NextResponse.json(
//       {
//         message: "Failed",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }

// // UPDATE

// export async function PATCH(
//   req: NextRequest,
//   {
//     params,
//   }: {
//     params: Promise<{ id: string }>;
//   },
// ) {
//   try {
//     const { id } = await params;

//     await connectDB();

//     const body = await req.json();

//     const validated = UpdateSchema.parse(body);

//     let update: any = {};

//     switch (validated.action) {
//       case "ADD_SUBCATEGORY":
//         update = {
//           $push: {
//             subCategories: validated.data,
//           },
//         };

//         break;

//       case "UPDATE_SUBCATEGORY":
//         update = {
//           $set: {
//             "subCategories.$[item]": validated.data,
//           },
//         };

//         break;

//       case "DELETE_SUBCATEGORY":
//         update = {
//           $pull: {
//             subCategories: {
//               name: validated.data.name,
//             },
//           },
//         };

//         break;

//       case "REPLACE_SUBCATEGORIES":
//         update = {
//           $set: {
//             subCategories: validated.data.subCategories,
//           },
//         };

//         break;

//       case "UPDATE_CATEGORY":
//         update = {
//           $set: {
//             category: validated.data.category,
//           },
//         };

//         break;
//     }

//     const updated = await MetaConfig.findByIdAndUpdate(id, update, {
//       returnDocument: "after",
//     });

//     if (!updated) {
//       return NextResponse.json(
//         {
//           message: "Meta config not found",
//         },
//         {
//           status: 404,
//         },
//       );
//     }
//      revalidatePath("/admin", "layout")
//      revalidatePath("/", "layout")
//     return NextResponse.json(updated);
//   } catch (error: any) {
//     return NextResponse.json(
//       {
//         message: error.message ?? "Update failed",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }

// // DELETE CATEGORY

// export async function DELETE(
//   req: NextRequest,
//   {
//     params,
//   }: {
//     params: Promise<{ id: string }>;
//   },
// ) {
//   try {
//      const { id } = await params;
//     await connectDB();

//     const deleted = await MetaConfig.findByIdAndDelete(id);

//     if (!deleted) {
//       return NextResponse.json(
//         {
//           message: "Not found",
//         },
//         {
//           status: 404,
//         },
//       );
//     }
//     revalidatePath("/admin", "layout")
//     revalidatePath("/", "layout")
//     return NextResponse.json({
//       message: "Deleted successfully",
//     });
//   } catch (error) {
//     return NextResponse.json(
//       {
//         message: "Delete failed",
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

const UpdateSchema = z.object({
  action: z.enum([
    "ADD_SUBCATEGORY",
    "UPDATE_SUBCATEGORY",
    "DELETE_SUBCATEGORY",
    "UPDATE_CATEGORY",
    "REPLACE_SUBCATEGORIES",
  ]),

  data: z.any(),
});

// GET SINGLE CATEGORY

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;

    const result = await db.query(
      `
SELECT *
FROM meta_configs
WHERE id=$1
`,
      [id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed",
      },
      {
        status: 500,
      },
    );
  }
}

// UPDATE

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const validated = UpdateSchema.parse(body);

    let query = "";
    let values: any[] = [];

    switch (validated.action) {
      case "ADD_SUBCATEGORY":
        query = `

UPDATE meta_configs

SET
sub_categories =
sub_categories || $1::jsonb,

updated_at=NOW()

WHERE id=$2

RETURNING *

`;

        values = [JSON.stringify([validated.data]), id];

        break;

      case "UPDATE_SUBCATEGORY":
        query = `

UPDATE meta_configs

SET

sub_categories = (

SELECT jsonb_agg(

CASE

WHEN item->>'name'=$1

THEN $2::jsonb

ELSE item

END

)

FROM jsonb_array_elements(sub_categories) item

),

updated_at=NOW()


WHERE id=$3

RETURNING *

`;

        values = [validated.data.name, JSON.stringify(validated.data), id];

        break;

      case "DELETE_SUBCATEGORY":
        query = `

UPDATE meta_configs

SET

sub_categories =

(

SELECT jsonb_agg(item)

FROM jsonb_array_elements(sub_categories) item

WHERE item->>'name' != $1

),

updated_at=NOW()


WHERE id=$2

RETURNING *

`;

        values = [validated.data.name, id];

        break;

      case "REPLACE_SUBCATEGORIES":
        query = `

UPDATE meta_configs

SET

sub_categories=$1::jsonb,

updated_at=NOW()


WHERE id=$2

RETURNING *

`;

        values = [JSON.stringify(validated.data.subCategories), id];

        break;

      case "UPDATE_CATEGORY":
        query = `

UPDATE meta_configs

SET

category=$1,

updated_at=NOW()


WHERE id=$2

RETURNING *

`;

        values = [validated.data.category, id];

        break;
    }

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Meta config not found",
        },
        {
          status: 404,
        },
      );
    }

    revalidatePath("/admin", "layout");

    revalidatePath("/", "layout");

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        message: error.message ?? "Update failed",
      },
      {
        status: 500,
      },
    );
  }
}

// DELETE CATEGORY

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;

    const result = await db.query(
      `
DELETE FROM meta_configs

WHERE id=$1

RETURNING *

`,
      [id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Not found",
        },
        {
          status: 404,
        },
      );
    }

    revalidatePath("/admin", "layout");

    revalidatePath("/", "layout");

    return NextResponse.json({
      message: "Deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Delete failed",
      },
      {
        status: 500,
      },
    );
  }
}
