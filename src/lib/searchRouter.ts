
import { fuseSearch } from "./fuse";
import { vectorSearch } from "./vectorSearch";


export type SearchType =
  | "place"
  | "category"
  | "semantic";


export interface SearchInput {

  language: string;

  searchType: SearchType;

  keywords: string[];

  place?: string | null;

  limit: number

}



export async function searchRouter(
  input: SearchInput,
  originalMessage: string
) {


  switch (input.searchType) {


    /**
     * Exact things:
     * 
     * Silver Fin
     * Rustic Villa
     * Police Station
     *
     */
    case "place":

      return {

        type: "fuse",

        results: await fuseSearch(
          input.place || input.keywords.join(" ")
        )

      };



    /**
     * Categories:
     *
     * Restaurants
     * Beaches
     * Guesthouses
     *
     */
    case "category":

      return {

        type: "fuse",

        results: await fuseSearch(
          input.keywords.join(" "),
          input.limit
        )

      };



    /**
     * Natural language:
     *
     * "best place for honeymoon"
     * "quiet beach for kids"
     * "romantic dinner"
     *
     */
    case "semantic":

      return {

        type: "vector",

        results: await vectorSearch(
          originalMessage
        )

      };



    default:

      return {

        type: "none",

        results: []

      };

  }

}