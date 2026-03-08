import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { GoodsRepository } from "../domain/GoodsRepository";
import type { EditGoodsDto } from "./EditGoodsDto";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { ListingType } from "@/app/shared/Authentication/domain/Listing";

export class EditGoodsUsecase {
  repo: GoodsRepository;
  constructor(repo: GoodsRepository) {
    this.repo = repo;
  }

  async execute(
    selectedGoodsIds: string[],
    listingId: string,
    listingType: ListingType,
  ): Promise<Result<string>> {
    const result = await this.repo.editListingGoods(
      listingType,
      this.toGoodsCategoryDto(selectedGoodsIds, listingId, listingType),
    );

    return toResult(result);
  }

  toGoodsCategoryDto(
    goods: string[],
    listingId: string,
    listingType: ListingType,
  ): EditGoodsDto[] {
    const isTrip = listingType === "trip";

    return goods.map((id: string) => ({
      trip_id: isTrip ? listingId : undefined,
      parcel_id: !isTrip ? listingId : undefined,
      category_id: id,
    }));
  }
}
