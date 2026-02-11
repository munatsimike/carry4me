export type Status = "Pending" | "InProgress" | "Completed";
export const toColorMapper: Record<Status, string> = {
  Pending: "bg-status-pending",
  InProgress: "bg-primary-500",
  Completed: "bg-status-success",
};
