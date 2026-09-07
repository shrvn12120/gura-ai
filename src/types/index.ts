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
