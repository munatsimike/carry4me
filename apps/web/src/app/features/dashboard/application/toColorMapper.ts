import type { Status } from "../domain/ActivityItem";

export const toColorMapper: Record<Status, string> = {
  Pending: "bg-status-pending",
  InProgress: "bg-primary-500",
  Completed: "bg-status-success",
};


