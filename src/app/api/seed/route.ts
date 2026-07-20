import { seedMetadataConfigs } from "@/lib/seed";
import { NextResponse } from "next/server";

export async function GET() {
  const status = await seedMetadataConfigs();
  if (status.success) {
    return NextResponse.json({ message: "Seeding finished perfectly", documentsCreated: status.count });
  }
  return NextResponse.json({ error: "Failed seeding database" }, { status: 500 });
}