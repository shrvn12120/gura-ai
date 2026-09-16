// src/app/api/admin/revisions/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT 
        r.*,
        l.title as listing_title,
        l.category as listing_category,
        l.description as original_description,
        l.contact_info as original_contact_info,
        l.images as original_images,
        l.metadata as original_metadata,
        l.active as original_active
      FROM listing_revisions r
      JOIN listings l ON r.listing_id = l.id
      WHERE r.status = 'pending_review'
      ORDER BY r.submitted_at DESC
    `);

    return NextResponse.json({ revisions: result.rows });
  } catch (error) {
    console.error("Error fetching revisions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}