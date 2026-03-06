import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { ParcelRepository } from "../domain/CreateParcelRepository";
import type { TableRow } from "../../trips/application/TripByIdUseCase";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { Parcel } from "../domain/Parcel";

export class ParcelByIdUseCase {
  repo: ParcelRepository;
  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<TableRow[]> | Result<null>> {
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

function toTableData(parcel: Parcel): TableRow {
  return {
    user: {
      id: parcel.user.id,
      fullName: parcel.user.fullName,
      avatarUrl: parcel.user.avatarUrl,
      countryCode: parcel.user.countryCode,
      city: parcel.user.city,
      phoneNumber: parcel.user.phoneNumber,
    },
    id: parcel.id,
    goods: parcel.categories,
    originCountry: parcel.route.originCountry,
    originCity: parcel.route.originCity,
    destinationCountry: parcel.route.destinationCountry,
    destinationCity: parcel.route.destinationCity,
    pricePerKg: parcel.pricePerKg,
    capacityKg: parcel.weightKg,
    departDate: "",
    status: "",
    goodsCategory: parcel.categories,
    itemDescription: parcel.items,
  };
}
