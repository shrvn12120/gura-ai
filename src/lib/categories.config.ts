export type Social = {
    name: string;
    link: string;
};
export type MetaField =
  | {
      key: string;
      label: string;
      type: "boolean";
      defaultValue?: boolean;
    }
  | {
      key: string;
      label: string;
      type: "string" | "number" | "textarea";
      placeholder?: string;
      defaultValue?: string | number;
    }
  | {
      key: string;
      label: string;
      type: "select";
      options: { label: string; value: string }[];
      defaultValue?: string;
    }
  | {
      key: string;
      label: string;
      type: "array";
      itemSchema: MetaField[];
      defaultValue?: any[];
    }






export const CATEGORY_SUBCATEGORY_META_CONFIGS: Record<
  string,
  Record<string, MetaField[]>
> = {


      "organization": {
        "default": [ {key: "near_by_places", label: "Near by placese", type: "array",
              itemSchema: [{key: "", label: "", type: "string"}]
            },
            {key: "place_description", label: "Place Description", type: "textarea"},],
        "government": [],
        "ngo": [],
        "community-group": [],
        "association": [],
        "club": [],
    },

    "place": {
        "default": [ {key: "near_by_places", label: "Near by placese", type: "array",
              itemSchema: [{key: "", label: "", type: "string"}]
            },
            {key: "place_description", label: "Place Description", type: "textarea"},],
        "hut": [],
        "gazebo": [],
        "pavilion": [],
        "viewpoint": [],
        "garden": [],
        "park": [],
    },

    "food-and-beverage": {
        "default": [ {key: "near_by_places", label: "Near by placese", type: "array",
              itemSchema: [{key: "", label: "", type: "string"}]
            },
            {key: "place_description", label: "Place Description", type: "textarea"},],
        "restaurant": [
  {
    key: "cuisine_types",
    label: "Cuisine Types",
    type: "array",
    itemSchema: [
      {
        key: "cuisine",
        label: "Cuisine",
        type: "string",
      },
    ],
  },
  {
    key: "opening_hours",
    label: "Opening Hours",
    type: "textarea",
    placeholder: "Daily: 07:00 - 22:00",
  },
  {
    key: "price_range",
    label: "Price Range",
    type: "select",
    options: [
      { label: "Budget", value: "budget" },
      { label: "Moderate", value: "moderate" },
      { label: "Premium", value: "premium" },
    ],
  },
  {
    key: "serves",
    label: "Serves",
    type: "array",
    itemSchema: [
      {
        key: "meal",
        label: "Meal",
        type: "string",
      },
    ],
  },
  {
    key: "dietary_options",
    label: "Dietary Options",
    type: "array",
    itemSchema: [
      {
        key: "option",
        label: "Option",
        type: "string",
      },
    ],
  },
  {
    key: "signature_dishes",
    label: "Signature Dishes",
    type: "array",
    itemSchema: [
      {
        key: "dish",
        label: "Dish Name",
        type: "string",
      },
    ],
  },
  {
    key: "reservation_required",
    label: "Reservation Required",
    type: "boolean",
  },
  {
    key: "takeaway_available",
    label: "Takeaway Available",
    type: "boolean",
  },
  {
    key: "delivery_available",
    label: "Delivery Available",
    type: "boolean",
  },
  {
    key: "outdoor_seating",
    label: "Outdoor Seating",
    type: "boolean",
  },
  {
    key: "air_conditioned",
    label: "Air Conditioned",
    type: "boolean",
  },
  {
    key: "accepts_card",
    label: "Accepts Card Payments",
    type: "boolean",
  },
  {
    key: "accepts_transfer",
    label: "Accepts Transfer Payments",
    type: "boolean",
  },
  {
    key: "halal",
    label: "Halal Food",
    type: "boolean",
    defaultValue: true,
  },],
        "cafe": [],
        "bar": [],
        "fast-food": [],
        "food-truck": [],
        "bakery": [],
        "ice-cream-shop": [],
        "juice-bar": [],
    },

    "shop": {
        "default": [ {key: "near_by_places", label: "Near by placese", type: "array",
              itemSchema: [{key: "", label: "", type: "string"}]
            },
            {key: "place_description", label: "Place Description", type: "textarea", placeholder: "describe how to identify this place. like main gate is arch big wooden door, outer wall is light cream color..."},],
        "clothing": [],
        "electronics": [],
        "grocery": [],
        "jewelry": [],
        "furniture": [],
        "bookstore": [],
        "gift-shop": [],
        "convenience-store": [],
        "pharmacy": [],
        "pet-store": [],
        "toy-store": [],
        "sporting-goods": [],
        "hardware-store": [],
        "beauty-supply": [],
        "art-gallery": [],
    },

    "accommodation": {
        "default": [
            {key: "near_by_places", label: "Near by placese", type: "array",
              itemSchema: [{key: "near_by", label: "Near By", type: "string"}]
            },
            {key: "place_description", label: "Place Description", type: "textarea"},
            {key: "amenities", label: "Amenities", type: "array",itemSchema: [{key: "amenitiy_name", label: "Amenitiy Name", type: "string"}] },
       
        ], 
        "hotel": [],
        "guesthouse": [],
        "apartment": [],
        "day-use": []
    },

    "attraction": {
        "default": [ {key: "near_by_places", label: "Near by placese", type: "array",
              itemSchema: [{key: "", label: "", type: "string"}]
            },
            {key: "place_description", label: "Place Description", type: "textarea", placeholder: "describe how to identify this place. like main gate is arch big wooden door, outer wall is light cream color..."},],
    },

    "service": {
        "default": [], 
        "delivery": [],
        "laundry": [],
        "bike-rental": [],
        "scooter-rental": [],
        "tour-guide": [],
        "travel-agency": [],
        "air-conditioning-repair": [],
        "plumbing": [],
        "electrician": [],
        "carpentry": [],
        "cleaning-service": [],
        "pet-care": [],
        "photography": [],
        "event-planning": [],
        "translation-service": [],
    },

    "activity": {
        "default": [ {key: "near_by_places", label: "Near by placese", type: "array",
              itemSchema: [{key: "", label: "", type: "string"}]
            },
            {key: "place_description", label: "Place Description", type: "textarea"},],
        "water-sports": [],
        "dive-center": [],
        "excursion-center": [],
        "fishing-trip": [],
        "snorkeling-trip": [],
        "boat-tour": [],
    },

    "beach": {
        "default": [ {key: "near_by_places", label: "Near by placese", type: "array",
              itemSchema: [{key: "", label: "", type: "string"}]
            },
            {key: "place_description", label: "Place Description", type: "textarea", placeholder: "describe how to identify this place. like main gate is arch big wooden door, outer wall is light cream color..."},],
    },

    "seller": {
        "default": [], 
        "baker": [],
        "home-food-producer": [],
        "bbq-items-seller": [],
        "short-eats-seller": [],
        "fish-seller": [],
        "fruit-seller": [],
        "vegetable-seller": [],
        "meat-seller": [],
        "":[],
       
    },

    "sports-&-fitness": {
        "default": [{key: "near_by_places", label: "Near by placese", type: "array",
              itemSchema: [{key: "near", label: "near", type: "string"}]
            },
            {key: "place_description", label: "Place Description", type: "textarea", placeholder: "describe how to identify this place. like main gate is arch big wooden door, outer wall is light cream color..."},],
    },

    "transport": {
        "default": [],
        "in-land": [],
        "sea": [],
    },
    "general-information": {
        "default": [],
        "about-island": [],
        "faq": [],
    }
};


export function getDefaultMeta(category: string, subCategory: string) {
  const fields =
    CATEGORY_SUBCATEGORY_META_CONFIGS?.[category]?.[subCategory] ||
    CATEGORY_SUBCATEGORY_META_CONFIGS?.[category]?.default ||
    [];

  const meta: Record<string, any> = {};

  const applyDefaults = (fields: MetaField[]) => {
    for (const field of fields) {
      switch (field.type) {
        case "boolean":
          meta[field.key] = field.defaultValue ?? false;
          break;

        case "array":
          meta[field.key] = field.defaultValue ?? [];
          break;

        case "number":
          meta[field.key] = field.defaultValue ?? 0;
          break;

        default:
          meta[field.key] = field.defaultValue ?? "";
          break;
      }
    }
  };

  applyDefaults(fields);

  return meta;
}