import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MetaConfig from "@/models/MetaConfig";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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

    revalidatePath("/admin", "layout")
    revalidatePath("/", "layout")

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
