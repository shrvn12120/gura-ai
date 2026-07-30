import Fuse from "fuse.js";
import Listing from "@/models/Listing";
import connectDB from "./mongodb";

let fuseInstance: Fuse<any> | null = null;



async function createFuseInstance() {

  await connectDB();


  const listings = await Listing.find(
    {
      active: true,
    },
    {
      title: 1,
      category: 1,
      subCategory: 1,
      description: 1,
      searchableText: 1,
      metadata: 1,
      images: 1,
      contact_info: 1,
      slug: 1,
    }
  ).lean();



  const fuse = new Fuse(
    listings,
    {

      includeScore: true,

      threshold: 0.35,

      ignoreLocation: true,

      minMatchCharLength: 2,


      keys: [

        {
          name: "title",
          weight: 0.45,
        },


        {
          name: "category",
          weight: 0.2,
        },


        {
          name: "subCategory",
          weight: 0.15,
        },


        {
          name: "searchableText",
          weight: 0.15,
        },


        {
          name: "description",
          weight: 0.05,
        }

      ]

    }
  );

  return fuse;

}




export async function getFuse() {

  if (fuseInstance) {
    return fuseInstance;
  }


  fuseInstance =
    await createFuseInstance();


  return fuseInstance;

}




export async function fuseSearch(
  query: string,
  limit?: number
) {

  const fuse =
    await getFuse();



  const results =
    fuse.search(query);



  return results
    .slice(0, limit || 8)
    .map((item)=>({

      score:item.score,

      ...item.item

    }));

}




// Call this after admin updates listings
export function clearFuseCache(){

  fuseInstance = null;

}