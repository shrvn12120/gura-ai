// src/app/api/listings/route.ts

import connectDB from "@/lib/mongodb";
import Listing from "@/models/listing.model";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import slugify from "slugify";

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();

  const listing = await Listing.create({
    ...body,
    slug: slugify(body.name, { lower: true }),
    islandId: "6a2b3316882b534c9d608058", // temporary hardcode for MVP
  });

  revalidatePath('/admin/listings')

  return NextResponse.json(listing);
}

export async function PATCH(
  req: Request,
) {
  await connectDB();


  const body = await req.json();


  const updateData: any = {
    ...body,
  };

  // regenerate slug if name changes
  if (body.name) {
    updateData.slug = slugify(body.name, { lower: true, strict: true });
  }

  const listing = await Listing.findByIdAndUpdate(
    body._id,
    updateData,
    {
     returnDocument: 'after',
      runValidators: true,
    }
  );

  if (!listing) {
    return NextResponse.json(
      { message: "Listing not found" },
      { status: 404 }
    );
  }
 revalidatePath('/admin/listings')
  return NextResponse.json(listing);
}

export async function DELETE(
  req: Request
) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");

    const listing = await Listing.findById(id);

    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          message: "Listing not found",
        },
        { status: 404 }
      );
    }

    await Listing.findByIdAndDelete(id);
 revalidatePath('/admin/listings')
    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.error("DELETE LISTING ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete listing",
      },
      { status: 500 }
    );
  }
}
