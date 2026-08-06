"use server";

import { MetaConfig } from "@/components/admin/meta-config/types";
import { db } from "@/lib/db";

// --------------------- //

type RetrievalType =
  | "general"
  | "knowledge"
  | "single"
  | "category"
  | "semantic";

export type IntentClassification = {
  type: RetrievalType;
  name: string | null;
  category: string | null;
  subCategory: string | null;
};

// 
// --------------------------------------------- //

export async function getMetaConfigs(): Promise<MetaConfig[]> {
    const res = await db.query(
    `
    SELECT *
    FROM meta_configs
      
    `
  );

  if (res.rows.length === 0) {
    return [];
  }

  return res.rows
}

export async function CATEGORY_META_CONFIGS() {
  "use cache";

  const items = await getMetaConfigs();
  const structuredTree: Record<string, Record<string, any>> = {};

  if (!items) return structuredTree;

  items.forEach((doc) => {
    const item = doc;
    const category = item.category;

    // 1. If the top-level category doesn't exist yet, create it dynamically
    if (!structuredTree[category]) {
      structuredTree[category] = {};
    }

    // 2. Safely check if subCategories array exists on this document record
    if (Array.isArray(item.sub_categories)) {
      item.sub_categories.forEach((subCat: any) => {
        // Use the subcategory's name as the key (e.g., "restaurant")
        const subCategoryKey = subCat.name || "default";

        // Map the fields array directly underneath that key matching the target layout structure
        structuredTree[category][subCategoryKey] = subCat.fields || [];
      });
    }
  });

  return structuredTree;
}

export async function getMetaConfigById(id: string) {
  const result = await db.query(
    `
    SELECT
      id,
      category,
      sub_categories,
      created_at,
      updated_at

    FROM meta_configs

    WHERE id = $1

    LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}
export async function getListingsById(id: string) {
  const result = await db.query(
    `
    SELECT *

    FROM listings

    WHERE id = $1

    LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}
export async function getActiveNotices() {
  const result = await db.query(
    `
    SELECT
      id,
      title,
      message,
      type,
      priority,
      is_active,
      created_at

    FROM notices

    WHERE is_active=true

    ORDER BY created_at DESC
    `,
  );

  return result.rows;
}
export async function getAllNotices() {
  const result = await db.query(
    `
    SELECT
      id,
      title,
      message,
      type,
      priority,
      is_active,
      created_at

    FROM notices

    ORDER BY created_at DESC
    `,
  );

  return result.rows;
}
export async function getNoticeById(id: string) {
  const result = await db.query(
    `
    SELECT *

    FROM notices

    WHERE id = $1

    LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}
