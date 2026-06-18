export type AIResponse = {
  type: "place" | "activity" | "info" | "list";

  title: string;
  description: string;

  categories?: string[];

  location?: {
    name: string;
    lat: number;
    lng: number;
  };

  actions?: Array<{
    type: "map" | "link" | "call" | "whatsapp" | "booking";
    label: string;
    url: string;
  }>;

  media?: Array<{
    type: "image" | "video";
    url: string;
    caption?: string;
  }>;

  markdown: string;
};