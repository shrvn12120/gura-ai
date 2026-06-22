"use server"

import connectDB from "@/lib/mongodb";
import Island from "@/models/island.model";
import { revalidatePath } from "next/cache";


export async function updateIsland(
  slug: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    heroImage?: string;
    country?: string;
    timezone?: string;
    isActive: boolean;
    location: {
      lat: number;
      lng: number;
    };
  }
) {
  try {
    await connectDB();


    const updated = await Island.findByIdAndUpdate(
      { _id: slug},
      {
        $set: data,
      },
      {
        new: true,
      }
    );

    if (!updated) {
      return {
        success: false,
        message: "Island not found",
      };
    }
revalidatePath("/admin")
    return {
      success: true,
      message: "Island updated successfully",
      island: JSON.parse(JSON.stringify(updated)),
    };
  } catch (error) {
    console.error("updateIsland error:", error);

    return {
      success: false,
      message: "Something went wrong",
    };
  }
}