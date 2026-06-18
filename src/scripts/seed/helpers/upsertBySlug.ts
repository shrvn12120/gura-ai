// src/scripts/seed/helpers/upsertBySlug.ts

export async function upsertBySlug(
  Model: any,
  data: any,
  extraQuery: Record<string, any> = {}
) {
  if (!data?.slug) {
    throw new Error("upsertBySlug: 'slug' is required");
  }

  return Model.findOneAndUpdate(
    {
      slug: data.slug,
      ...extraQuery,
    },
    {
      $set: {
        ...data,
      },
    },
    {
      returnDocument: 'after',
      upsert: true,   // create if not exists
    }
  );
}