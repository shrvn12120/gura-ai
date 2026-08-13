// export function formatListing(listing: any) {
//   if (!listing) {
//     return "";
//   }

import { ListingFormData } from "@/components/admin/ListingForm";
import { MetaField } from "./categories.config";

//   return `

// LISTING

// Name:
// ${listing.title ?? "Unknown"}


// Category:
// ${listing.category ?? ""}


// Sub Category:
// ${listing.subCategory ?? ""}


// Description:
// ${listing.description ?? ""}


// Contact info:
// ${formatContact(listing.contact_info)}


// Spec:
// ${formatMetadata(listing.metadata)}


// Location:
// ${formatLocation(listing.contact_info.coordinates)}


// Images:
// ${formatImages(listing.images)}

// `;
// }

// export function formatListings(listings: any[]) {
//   if (!listings || listings.length === 0) {
//     return "";
//   }

//   return listings.map(formatListing).join("\n\n----------------\n\n");
// }

// function formatContact(contact: any) {
//   if (!contact) {
//     return "Not available";
//   }

//   return JSON.stringify(
//     {
//       address: contact?.address || "not_available",
//       email: contact?.email || "not_available",
//       phone: contact?.phone || "not_available",
//       whatsapp: contact?.whatsapp || "not_available",
//       socials: contact?.socials || "not_available",
//     },
//     null,
//     2,
//   );
// }

// function formatMetadata(metadata: any) {
//   if (!metadata) {
//     return "No additional details";
//   }

//   return JSON.stringify(metadata, null, 2);
// }

// function formatLocation(location: any) {
//   if (!location) {
//     return "Not available";
//   }

//   return JSON.stringify(location, null, 2);
// }

// function formatImages(images: any) {
//   if (!images || !Array.isArray(images)) {
//     return "No images";
//   }

//   return images
//     .slice(0, 3)
//     .map((image: any) => {
//       return `
// URL:
// ${image.url ?? image}

// Alt:
// ${image.alt ?? ""}

// `;
//     })
//     .join("\n");
// }






/*
 * --------------------------------------------------
 * LISTING
 * --------------------------------------------------
 */

export function formatListing(listing: ListingFormData) {
  if (!listing) {
    return "";
  }

  const lines: string[] = [];

  /*
   * Basic information
   */

  if (listing.title) {
    lines.push(`- Name: ${listing.title}`);
  }

  if (listing.category) {
    lines.push(`- Category: ${listing.category}`);
  }

  if (listing.subCategory) {
    lines.push(`- Sub Category: ${listing.subCategory}`);
  }

  if (listing.description) {
    lines.push(`- Description: ${listing.description}`);
  }

  /*
   * Contact
   */

  const contact = formatContact(listing.contact_info);

  if (contact) {
    lines.push(`- Contact:\n${contact}`);
  }

  /*
   * Metadata
   */

  const metadata = formatMetadata(listing.metadata);

  if (metadata) {
    lines.push(`- Details:\n${metadata}`);
  }

  /*
   * Location
   */

  const location = formatLocation(
    listing.contact_info?.coordinates,
  );

  if (location) {
    lines.push(`- Location: ${location}`);
  }

  /*
   * Images
   */

  const images = formatImages(listing.images);

  if (images) {
    lines.push(`- Images:\n${images}`);
  }

  return lines.join("\n");
}


/*
 * --------------------------------------------------
 * MULTIPLE LISTINGS
 * --------------------------------------------------
 */

export function formatListings(
  listings: ListingFormData[],
) {
  if (!Array.isArray(listings) || listings.length === 0) {
    return "";
  }

  return listings
    .map(formatListing)
    .filter(Boolean)
    .join("\n\n---\n\n");
}


/*
 * --------------------------------------------------
 * CONTACT
 * --------------------------------------------------
 */

function formatContact(
  contact: ListingFormData["contact_info"],
) {
  if (!contact) {
    return "";
  }

  const lines: string[] = [];

  if (contact.address) {
    lines.push(`  - Address: ${contact.address}`);
  }

  if (contact.phone) {
    lines.push(`  - Phone: ${contact.phone}`);
  }

  if (contact.email) {
    lines.push(`  - Email: ${contact.email}`);
  }

  if (contact.whatsapp) {
    lines.push(`  - WhatsApp: ${contact.whatsapp}`);
  }

  /*
   * Social links
   */

  if (
    Array.isArray(contact.socials) &&
    contact.socials.length > 0
  ) {
    for (const social of contact.socials) {
      if (!social?.name || !social?.link) {
        continue;
      }

      lines.push(
        `  - ${social.name}: ${social.link}`,
      );
    }
  }

  return lines.join("\n");
}


/*
 * --------------------------------------------------
 * METADATA
 * --------------------------------------------------
 */

function formatMetadata(
  metadata: ListingFormData["metadata"],
) {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const lines: string[] = [];

  for (const field of Object.values(metadata)) {
    if (!field) {
      continue;
    }

    const value = field.defaultValue;

    /*
     * Do not send empty values.
     */

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    /*
     * Boolean
     */

    if (field.type === "boolean") {
      lines.push(
        `  - ${field.label}: ${value ? "Yes" : "No"}`,
      );

      continue;
    }

    /*
     * Array
     */

    if (field.type === "array") {
      if (!Array.isArray(value) || value.length === 0) {
        continue;
      }

      const formattedArray = formatArrayValue(
        value,
        field.itemSchema,
      );

      if (formattedArray) {
        lines.push(
          `  - ${field.label}:\n${formattedArray}`,
        );
      }

      continue;
    }

    /*
     * Select
     *
     * Store the human-readable option label
     * instead of exposing the internal value.
     */

    if (field.type === "select") {
      const option = field.options.find(
        (option) => option.value === value,
      );

      const displayValue =
        option?.label ?? String(value);

      lines.push(
        `  - ${field.label}: ${displayValue}`,
      );

      continue;
    }

    /*
     * String / Number / Textarea
     */

    lines.push(
      `  - ${field.label}: ${String(value)}`,
    );
  }

  return lines.join("\n");
}


/*
 * --------------------------------------------------
 * ARRAY METADATA
 * --------------------------------------------------
 */

function formatArrayValue(
  values: any[],
  schema: MetaField[],
) {
  const lines: string[] = [];

  for (const item of values) {
    /*
     * Simple array:
     *
     * ["WiFi", "Breakfast", "Pool"]
     */

    if (
      typeof item !== "object" ||
      item === null
    ) {
      lines.push(`    - ${String(item)}`);
      continue;
    }

    /*
     * Object array:
     *
     * [
     *   {
     *     name: "Room 1",
     *     price: 100
     *   }
     * ]
     */

    const itemLines: string[] = [];

    for (const field of schema) {
      const value = item[field.key];

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        continue;
      }

      let displayValue = value;

      /*
       * Boolean
       */

      if (field.type === "boolean") {
        displayValue = value ? "Yes" : "No";
      }

      /*
       * Select
       */

      if (field.type === "select") {
        const option = field.options.find(
          (option) => option.value === value,
        );

        displayValue =
          option?.label ?? String(value);
      }

      /*
       * Array
       */

      if (field.type === "array") {
        if (Array.isArray(value)) {
          displayValue = value.join(", ");
        }
      }

      itemLines.push(
        `    - ${field.label}: ${displayValue}`,
      );
    }

    if (itemLines.length > 0) {
      lines.push(itemLines.join("\n"));
    }
  }

  return lines.join("\n");
}


/*
 * --------------------------------------------------
 * LOCATION
 * --------------------------------------------------
 */

function formatLocation(
  coordinates:
    | ListingFormData["contact_info"]["coordinates"]
    | undefined,
) {
  if (!coordinates) {
    return "";
  }

  if (!coordinates.lat || !coordinates.lng) {
    return "";
  }

  return `latitude ${coordinates.lat}, longitude ${coordinates.lng}`;
}


/*
 * --------------------------------------------------
 * IMAGES
 * --------------------------------------------------
 */

function formatImages(
  images: ListingFormData["images"],
) {
  if (!Array.isArray(images) || images.length === 0) {
    return "";
  }

  return images
    .slice(0, 3)
    .map((image, index) => {
      if (!image?.url) {
        return "";
      }

      if (image.alt) {
        return `  - Image ${index + 1}: ${image.url} — ${image.alt}`;
      }

      return `  - Image ${index + 1}: ${image.url}`;
    })
    .filter(Boolean)
    .join("\n");
}


