// // src/app/api/admin/revisions/[id]/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db"; // Adjust import path to your DB connection

// export async function POST(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id: revisionId } = await params;
//     const body = await request.json();
//     const { action, rejection_reason, reviewer_id } = body;

//     if (action !== "approve" && action !== "reject") {
//       return NextResponse.json(
//         { error: "Invalid action. Must be 'approve' or 'reject'." },
//         { status: 400 }
//       );
//     }

//     // 1. Fetch the revision record
//     const revResult = await db.query(
//       `SELECT * FROM listing_revisions WHERE id = $1 LIMIT 1`,
//       [revisionId]
//     );

//     if (revResult.rows.length === 0) {
//       return NextResponse.json(
//         { error: "Revision not found" },
//         { status: 404 }
//       );
//     }

//     const revision = revResult.rows[0];

//     if (revision.status !== "pending_review") {
//       return NextResponse.json(
//         { error: `Revision has already been ${revision.status}` },
//         { status: 400 }
//       );
//     }

//     if (action === "approve") {
//       // Begin transaction to update the primary listing and mark revision as approved
//       await db.query("BEGIN");

//       try {
//         // 2. Overwrite the main listing with the accepted revision data
//         await db.query(
//           `
//             UPDATE listings
//             SET
//               description = $2,
//               contact_info = $3,
//               images = $4,
//               metadata = $5,
//               active = $6,
//               updated_at = NOW()
//             WHERE id = $1
//           `,
//           [
//             revision.listing_id,
//             revision.description,
//             typeof revision.contact_info === "string"
//               ? revision.contact_info
//               : JSON.stringify(revision.contact_info),
//             typeof revision.images === "string"
//               ? revision.images
//               : JSON.stringify(revision.images),
//             typeof revision.metadata === "string"
//               ? revision.metadata
//               : JSON.stringify(revision.metadata),
//             revision.active,
//           ]
//         );

//         // 3. Mark the revision as approved
//         await db.query(
//           `
//             UPDATE listing_revisions
//             SET
//               status = 'approved',
//               reviewed_by = $2,
//               reviewed_at = NOW()
//             WHERE id = $1
//           `,
//           [revisionId, reviewer_id ?? null]
//         );

//         // 4. Optionally clear/sync listing_drafts for this listing
//         await db.query(
//           `DELETE FROM listing_drafts WHERE listing_id = $1`,
//           [revision.listing_id]
//         );

//         await db.query("COMMIT");

//         return NextResponse.json({
//           success: true,
//           message: "Revision approved and listing updated successfully.",
//         });
//       } catch (err) {
//         await db.query("ROLLBACK");
//         throw err;
//       }
//     } else {
//       // Mark revision as rejected
//       await db.query(
//         `
//           UPDATE listing_revisions
//           SET
//             status = 'rejected',
//             rejection_reason = $2,
//             reviewed_by = $3,
//             reviewed_at = NOW()
//           WHERE id = $1
//         `,
//         [revisionId, rejection_reason || null, reviewer_id ?? null]
//       );

//       return NextResponse.json({
//         success: true,
//         message: "Revision rejected.",
//       });
//     }
//   } catch (error) {
//     console.error("Admin revision action error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/admin/revisions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function buildSearchableText(data: {
  title?: string | null;
  category?: string | null;
  description?: string | null;
  metadata?: unknown;
}): string {
  const parts: string[] = [];

  if (data.title) parts.push(`Title: ${data.title}`);
  if (data.category) parts.push(`Category: ${data.category}`);
  if (data.description) parts.push(`Description: ${data.description}`);
  if (data.metadata && typeof data.metadata === "object") {
    parts.push(`Metadata: ${JSON.stringify(data.metadata)}`);
  }

  return parts.join("\n").trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: revisionId } = await params;
    const body = await request.json();
    const { action, rejection_reason, reviewer_id } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    // 1. Fetch the revision record
    const revResult = await db.query(
      `SELECT * FROM listing_revisions WHERE id = $1 LIMIT 1`,
      [revisionId]
    );

    if (revResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Revision not found" },
        { status: 404 }
      );
    }

    const revision = revResult.rows[0];

    if (revision.status !== "pending_review") {
      return NextResponse.json(
        { error: `Revision has already been ${revision.status}` },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // 2. Fetch primary listing title & category to build complete searchable text
      const mainListingResult = await db.query(
        `SELECT title, category FROM listings WHERE id = $1 LIMIT 1`,
        [revision.listing_id]
      );

      const existingListing = mainListingResult.rows[0] || {};

      const searchableText = buildSearchableText({
        title: revision.title ?? existingListing.title,
        category: revision.category ?? existingListing.category,
        description: revision.description,
        metadata: revision.metadata,
      });

      let queryVector: string | null = null;

      // 3. Generate new 512-dim embedding if searchable text exists
      if (searchableText) {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: searchableText,
          dimensions: 512,
        });

        const embedding = embeddingResponse.data[0]?.embedding;
        if (embedding) {
          queryVector = `[${embedding.join(",")}]`;
        }
      }

      // 4. Begin transaction
      await db.query("BEGIN");

      try {
        // Update main listing with approved revision data & new embedding
        await db.query(
          `
            UPDATE listings
            SET
              description = $2,
              contact_info = $3::jsonb,
              images = $4::jsonb,
              metadata = $5::jsonb,
              active = $6,
              embedding = CASE WHEN $7::vector IS NOT NULL THEN $7::vector ELSE embedding END,
              updated_at = NOW()
            WHERE id = $1
          `,
          [
            revision.listing_id,
            revision.description,
            revision.contact_info,
            revision.images,
            revision.metadata,
            revision.active,
            queryVector,
          ]
        );

        // Mark revision as approved
        await db.query(
          `
            UPDATE listing_revisions
            SET
              status = 'approved',
              reviewed_by = $2,
              reviewed_at = NOW()
            WHERE id = $1
          `,
          [revisionId, reviewer_id ?? null]
        );

        // Clear associated drafts
        await db.query(
          `DELETE FROM listing_drafts WHERE listing_id = $1`,
          [revision.listing_id]
        );

        await db.query("COMMIT");

        return NextResponse.json({
          success: true,
          message: "Revision approved, listing updated, and embedding regenerated successfully.",
        });
      } catch (err) {
        await db.query("ROLLBACK");
        throw err;
      }
    } else {
      // Mark revision as rejected
      await db.query(
        `
          UPDATE listing_revisions
          SET
            status = 'rejected',
            rejection_reason = $2,
            reviewed_by = $3,
            reviewed_at = NOW()
          WHERE id = $1
        `,
        [revisionId, rejection_reason || null, reviewer_id ?? null]
      );

      return NextResponse.json({
        success: true,
        message: "Revision rejected.",
      });
    }
  } catch (error) {
    console.error("Admin revision action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}