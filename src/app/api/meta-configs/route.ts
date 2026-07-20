// // app/api/meta-configs/route.ts
// import { NextResponse } from "next/server";
// import MetaConfig from "@/models/MetaConfig";
// import connectDB from "@/lib/mongodb";

// // Fetch configurations
// export async function GET(request: Request) {
//   await connectDB();
//   const { searchParams } = new URL(request.url);
//   const category = searchParams.get("category");
//   const subCategory = searchParams.get("subCategory");

//   try {
//     if (category && subCategory) {
//       // Direct match or fallback to default
//       let config = await MetaConfig.findOne({ category, subCategory });
//       if (!config && subCategory !== "default") {
//         config = await MetaConfig.findOne({ category, subCategory: "default" });
//       }
//       return NextResponse.json(config ? config.fields : []);
//     }

//     const allConfigs = await MetaConfig.find({});
//     return NextResponse.json(allConfigs);
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// // Bulk Upsert or Single Save
// export async function POST(request: Request) {
//   await connectDB();
//   try {
//     const body = await request.json();
//     const { category, subCategory, fields } = body;

//     const updatedConfig = await MetaConfig.findOneAndUpdate(
//       { category, subCategory },
//       { category, subCategory, fields },
//       { upsert: true, new: true }
//     );

//     return NextResponse.json(updatedConfig);
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MetaConfig from "@/models/MetaConfig";
import { z } from "zod";
import { revalidateTag } from "next/cache";

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

export async function GET() {
  try {
    await connectDB();

    const configs = await MetaConfig.find().sort({
      createdAt: -1,
    });

    return NextResponse.json(configs);
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
    await connectDB();

    const body = await req.json();

    const validated = CreateMetaConfigSchema.parse(body);

    const exists = await MetaConfig.findOne({
      category: validated.category,
    });

    if (exists) {
      return NextResponse.json(
        {
          message: "Category already exists",
        },
        {
          status: 409,
        },
      );
    }

    const config = await MetaConfig.create({
      category: validated.category,

      subCategories: validated.subCategories ?? [],
    });

    revalidateTag("meta-config", "max")

    return NextResponse.json(config, {
      status: 201,
    });
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
