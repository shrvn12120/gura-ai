
import { accommodationSeed } from "./accommodation.seed";
import { rentalSeed } from "./rental.seed";
import { restaurantSeed } from "./restaurant.seed";
import { activitySeed } from "./activity.seed";
import { placeSeed } from "./place.seed";
import { upsertBySlug } from "./helpers/upsertBySlug";

import Listing from "../../models/listing.model";
import islandModel from "../../models/island.model";
import { islandSeed } from "./island.seed";
import connectDB from "@/lib/mongodb";



async function runSeed() {
  console.log("🔥 INDEX SEED FILE RUNNING");
  await connectDB();

  console.log("🌴 Seeding island...");

  const island = await upsertBySlug(islandModel, islandSeed);

  console.log("🏝 Island seeded:", island.name);

  const allListings = [
    ...accommodationSeed,
    ...rentalSeed,
    ...restaurantSeed,
    ...activitySeed,
    ...placeSeed,
  ];

  for (const item of allListings) {
    await upsertBySlug(Listing, {
      ...item,
      islandId: island._id,
    });

    console.log("✔ Seeded:", item.name);
  }

  console.log("✅ Seeding completed");
  process.exit();
}

runSeed().catch((err) => {
  console.error(err);
  process.exit(1);
});