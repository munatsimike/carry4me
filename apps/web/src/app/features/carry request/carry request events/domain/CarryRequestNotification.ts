import type { CarryRequestEventType } from "../../domain/CarryRequestEvent";

export type CarryRequestNotification = {
  id:string,
  userId: string;
  type: CarryRequestEventType;
  title: string;
  body: string;
  link: string;
  createdAt:string,
  readAt:string
};
