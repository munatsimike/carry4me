import type { CarryRequestEventType } from "../../domain/CarryRequestEvent";

export type CarryRequestNotification = {
  userId: string;
  type: CarryRequestEventType;
  title: string;
  body: string;
  link: string;
   metadata?: Record<string, unknown>;
};
