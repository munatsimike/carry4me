export type Status = "Pending" | "InProgress" | "Completed";

export type ActivityItem = {
  status: Status;
  count: number;
  title: string;
};