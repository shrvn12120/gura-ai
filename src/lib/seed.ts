import connectDB from "@/lib/mongodb";
import MetaConfig from "@/models/MetaConfig";

const RAW_CONFIG_DATA: Record<string, Record<string, any[]>> = {
  "organization": {
    "default": [
      { key: "near_by_places", label: "Near by places", type: "array", itemSchema: [{ key: "", label: "", type: "string" }] },
      { key: "place_description", label: "Place Description", type: "textarea" }
    ],
    "government": [], "ngo": [], "community-group": [], "association": [], "club": []
  },
  "place": {
    "default": [
      { key: "near_by_places", label: "Near by places", type: "array", itemSchema: [{ key: "", label: "", type: "string" }] },
      { key: "place_description", label: "Place Description", type: "textarea" }
    ],
    "hut": [], "gazebo": [], "pavilion": [], "viewpoint": [], "garden": [], "park": []
  },
  "food-and-beverage": {
    "default": [
      { key: "near_by_places", label: "Near by places", type: "array", itemSchema: [{ key: "", label: "", type: "string" }] },
      { key: "place_description", label: "Place Description", type: "textarea" }
    ],
    "restaurant": [
      { key: "cuisine_types", label: "Cuisine Types", type: "array", itemSchema: [{ key: "cuisine", label: "Cuisine", type: "string" }] },
      { key: "opening_hours", label: "Opening Hours", type: "textarea", placeholder: "Daily: 07:00 - 22:00" },
      { key: "price_range", label: "Price Range", type: "select", options: [{ label: "Budget", value: "budget" }, { label: "Moderate", value: "moderate" }, { label: "Premium", value: "premium" }] },
      { key: "serves", label: "Serves", type: "array", itemSchema: [{ key: "meal", label: "Meal", type: "string" }] },
      { key: "dietary_options", label: "Dietary Options", type: "array", itemSchema: [{ key: "option", label: "Option", type: "string" }] },
      { key: "signature_dishes", label: "Signature Dishes", type: "array", itemSchema: [{ key: "dish", label: "Dish Name", type: "string" }] },
      { key: "reservation_required", label: "Reservation Required", type: "boolean" },
      { key: "takeaway_available", label: "Takeaway Available", type: "boolean" },
      { key: "delivery_available", label: "Delivery Available", type: "boolean" },
      { key: "outdoor_seating", label: "Outdoor Seating", type: "boolean" },
      { key: "air_conditioned", label: "Air Conditioned", type: "boolean" },
      { key: "accepts_card", label: "Accepts Card Payments", type: "boolean" },
      { key: "accepts_transfer", label: "Accepts Transfer Payments", type: "boolean" },
      { key: "halal", label: "Halal Food", type: "boolean", defaultValue: true }
    ],
    "cafe": [], "bar": [], "fast-food": [], "food-truck": [], "bakery": [], "ice-cream-shop": [], "juice-bar": []
  },
  "shop": {
    "default": [
      { key: "near_by_places", label: "Near by places", type: "array", itemSchema: [{ key: "", label: "", type: "string" }] },
      { key: "place_description", label: "Place Description", type: "textarea", placeholder: "describe how to identify this place..." }
    ],
    "clothing": [], "electronics": [], "grocery": [], "jewelry": [], "furniture": [], "bookstore": [], "gift-shop": [], "convenience-store": [], "pharmacy": [], "pet-store": [], "toy-store": [], "sporting-goods": [], "hardware-store": [], "beauty-supply": [], "art-gallery": []
  },
  "accommodation": {
    "default": [
      { key: "near_by_places", label: "Near by places", type: "array", itemSchema: [{ key: "near_by", label: "Near By", type: "string" }] },
      { key: "place_description", label: "Place Description", type: "textarea" },
      { key: "amenities", label: "Amenities", type: "array", itemSchema: [{ key: "amenitiy_name", label: "Amenitiy Name", type: "string" }] }
    ],
    "hotel": [], "guesthouse": [], "apartment": [], "day-use": []
  },
  "attraction": {
    "default": [
      { key: "near_by_places", label: "Near by places", type: "array", itemSchema: [{ key: "", label: "", type: "string" }] },
      { key: "place_description", label: "Place Description", type: "textarea", placeholder: "describe how to identify this place..." }
    ]
  },
  "service": {
    "default": [], "delivery": [], "laundry": [], "bike-rental": [], "scooter-rental": [], "tour-guide": [], "travel-agency": [], "air-conditioning-repair": [], "plumbing": [], "electrician": [], "carpentry": [], "cleaning-service": [], "pet-care": [], "photography": [], "event-planning": [], "translation-service": []
  },
  "activity": {
    "default": [
      { key: "near_by_places", label: "Near by places", type: "array", itemSchema: [{ key: "", label: "", type: "string" }] },
      { key: "place_description", label: "Place Description", type: "textarea" }
    ],
    "water-sports": [], "dive-center": [], "excursion-center": [], "fishing-trip": [], "snorkeling-trip": [], "boat-tour": []
  },
  "beach": {
    "default": [
      { key: "near_by_places", label: "Near by places", type: "array", itemSchema: [{ key: "", label: "", type: "string" }] },
      { key: "place_description", label: "Place Description", type: "textarea", placeholder: "describe how to identify this place..." }
    ]
  },
  "seller": {
    "default": [], "baker": [], "home-food-producer": [], "bbq-items-seller": [], "short-eats-seller": [], "fish-seller": [], "fruit-seller": [], "vegetable-seller": [], "meat-seller": []
  },
  "sports-&-fitness": {
    "default": [
      { key: "near_by_places", label: "Near by places", type: "array", itemSchema: [{ key: "near", label: "near", type: "string" }] },
      { key: "place_description", label: "Place Description", type: "textarea", placeholder: "describe how to identify this place..." }
    ]
  },
  "transport": {
    "default": [], "in-land": [], "sea": []
  },
  "general-information": {
    "default": [], "about-island": [], "faq": []
  }
};

export async function seedMetadataConfigs() {
  try {
    await connectDB();
    console.log("Connecting to Database for initialization seeding...");

    // 1. Wipe collection clean to build a predictable configurations state map
    await MetaConfig.deleteMany({});
    console.log("Cleared old configurations database logs.");

    // 2. Transform our key matrix into structural document shapes matching SubCategorySchema layout rules
    const targetDocuments = Object.entries(RAW_CONFIG_DATA).map(([categoryName, subCategoryObject]) => {
      
      // Parse subCategory records mapping names into embedded arrays
      const mappedSubCategories = Object.entries(subCategoryObject).map(([subCatName, fieldsArray]) => {
        return {
          name: subCatName,
          fields: fieldsArray
        };
      });

      return {
        category: categoryName,
        subCategories: mappedSubCategories
      };
    });

    // 3. Insert documents securely into MongoDB
    const result = await MetaConfig.insertMany(targetDocuments);
    console.log(`Success! Successfully seeded ${result.length} root metadata configuration categories entries.`);
    
    return { success: true, count: result.length };
  } catch (error) {
    console.error("Critical seeding script error processing matrix arrays:", error);
    return { success: false, error };
  }
}