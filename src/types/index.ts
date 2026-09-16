import { MetaField } from "@/components/admin/meta-config/types";

export type NoticeType =
  | "event"
  | "announcement"
  | "warning"
  | "info";


export type NoticePriority =
  | "low"
  | "medium"
  | "high";


export interface INotice {
  id:string;
  title: string;
  message: string;
  type: NoticeType;
  priority: NoticePriority;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface PublicListingRevision {
  description: string;

  contact_info: {
    address?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    socials?: {
      name: string;
      link: string;
    }[];
    coordinates?: {
      lat: string;
      lng: string;
    };
  };

  images: {
    id: string;
    url: string;
    alt: string;
  }[];

  metadata: Record<string, MetaField>;

  active: boolean;
}