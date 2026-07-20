export function formatListing(listing: any) {
  if (!listing) {
    return "";
  }

  return `

LISTING

Name:
${listing.title ?? "Unknown"}


Category:
${listing.category ?? ""}


Sub Category:
${listing.subCategory ?? ""}


Description:
${listing.description ?? ""}


Contact info:
${formatContact(listing.contact_info)}


Spec:
${formatMetadata(listing.metadata)}


Location:
${formatLocation(listing.contact_info.coordinates)}


Images:
${formatImages(listing.images)}

`;
}

export function formatListings(listings: any[]) {
  if (!listings || listings.length === 0) {
    return "";
  }

  return listings.map(formatListing).join("\n\n----------------\n\n");
}

function formatContact(contact: any) {
  if (!contact) {
    return "Not available";
  }

  return JSON.stringify(
    {
      address: contact?.address || "not_available",
      email: contact?.email || "not_available",
      phone: contact?.phone || "not_available",
      whatsapp: contact?.whatsapp || "not_available",
      socials: contact?.socials || "not_available",
    },
    null,
    2,
  );
}

function formatMetadata(metadata: any) {
  if (!metadata) {
    return "No additional details";
  }

  return JSON.stringify(metadata, null, 2);
}

function formatLocation(location: any) {
  if (!location) {
    return "Not available";
  }

  return JSON.stringify(location, null, 2);
}

function formatImages(images: any) {
  if (!images || !Array.isArray(images)) {
    return "No images";
  }

  return images
    .slice(0, 3)
    .map((image: any) => {
      return `
URL:
${image.url ?? image}

Alt:
${image.alt ?? ""}

`;
    })
    .join("\n");
}
