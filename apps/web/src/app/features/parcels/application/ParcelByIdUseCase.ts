import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { ParcelRepository } from "../domain/CreateParcelRepository";
import type { TableData } from "../../trips/application/TripByIDUseCase";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { Parcel } from "../domain/Parcel";

export class ParcelByIdUseCase {
  repo: ParcelRepository;
  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<TableData[]> | Result<null>> {
    const result = await this.repo.parcelById(userId);
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

function toTableData(parcel: Parcel): TableData {
  return {
    id:parcel.id,
    goods: parcel.categories,
    originCountry: parcel.route.originCountry,
    originCity: parcel.route.originCity,
    destinationCountry: parcel.route.destinationCountry,
    destinationCity: parcel.route.destinationCity,
    pricePerKg: parcel.pricePerKg,
    capacityKg: parcel.weightKg,
    departDate: "",
    status: ""
  };
}
