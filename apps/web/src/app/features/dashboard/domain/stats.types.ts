import type { Status } from "../application/toColorMapper";

type Statistics = {
  postedTrips: number;
  postedParcels: number;
  totalMatches: number;
  pendingAproval: number;
  awaitingPayment: number;
  awaitingHandover: number;
  inProgress: number;
  delivered: number; // PAID_OUT
};

export type RequestStats = {
  stats: Statistics;
};


export type StatsItem = {
  itemName: string;
  count: number;
  status?: Status;
};
