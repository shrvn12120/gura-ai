import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";

import MetaConfig from "@/models/MetaConfig";

import { z } from "zod";
import { revalidateTag } from "next/cache";

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

    await connectDB();

    const config = await MetaConfig.findById(id);

    if (!config) {
      return NextResponse.json(
        {
          message: "Not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(config);
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

    await connectDB();

    const body = await req.json();

    const validated = UpdateSchema.parse(body);

    let update: any = {};

    switch (validated.action) {
      case "ADD_SUBCATEGORY":
        update = {
          $push: {
            subCategories: validated.data,
          },
        };

        break;

      case "UPDATE_SUBCATEGORY":
        update = {
          $set: {
            "subCategories.$[item]": validated.data,
          },
        };

        break;

      case "DELETE_SUBCATEGORY":
        update = {
          $pull: {
            subCategories: {
              name: validated.data.name,
            },
          },
        };

        break;

      case "REPLACE_SUBCATEGORIES":
        update = {
          $set: {
            subCategories: validated.data.subCategories,
          },
        };

        break;

      case "UPDATE_CATEGORY":
        update = {
          $set: {
            category: validated.data.category,
          },
        };

        break;
    }

    const updated = await MetaConfig.findByIdAndUpdate(id, update, {
      returnDocument: "after",
    });

    if (!updated) {
      return NextResponse.json(
        {
          message: "Meta config not found",
        },
        {
          status: 404,
        },
      );
    }
 revalidateTag("meta-config", "max")
    return NextResponse.json(updated);
  } catch (error: any) {
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
    await connectDB();

    const deleted = await MetaConfig.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Not found",
        },
        {
          status: 404,
        },
      );
    }
 revalidateTag("meta-config", "max")
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
