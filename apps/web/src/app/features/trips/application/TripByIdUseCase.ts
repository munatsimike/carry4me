import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { TripsRepository } from "../domain/TripRepository";
import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { Trip } from "../domain/Trip";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";

export type TableData = {
  id: string;
  goods: GoodsCategory[];
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  pricePerKg: number;
  capacityKg: number;
  departDate: string;
  status: string
};

export class TripByIdUseCase {
  repo: TripsRepository;
  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<TableData[]> | Result<null>> {
    const result = await this.repo.tripById(userId);
    if (result.data) {
      const tableData = result.data.map(toTableData);
      return toResult({ data: tableData, error: null, status: null });
    }
    return toResult({
      data: result.data,
      error: result.error,
      status: result.status,
    });
  }
}

export function toTableData(trip: Trip): TableData {
  return {
    id:trip.id,
    goods: trip.acceptedGoods,
    originCountry: trip.route.originCountry,
    originCity: trip.route.originCity,
    destinationCountry: trip.route.destinationCountry,
    destinationCity: trip.route.destinationCity,
    pricePerKg: trip.pricePerKg,
    capacityKg: trip.capacityKg,
    departDate: trip.departDate,
    status: trip.status
  };
}
