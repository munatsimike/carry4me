import type { ListingType } from "@/app/shared/Authentication/domain/Listing";
import type { GoodsRepository } from "../domain/GoodsRepository";
import type { EditGoodsDto } from "./EditGoodsDto";

export class EditGoodsUsecase {
  repo: GoodsRepository;
  constructor(repo: GoodsRepository) {
    this.repo = repo;
  }

  async execute(
    selectedGoodsIds: string[],
    listingId: string,
    listingType: ListingType,
  ): Promise<string> {
    return await this.repo.editListingGoods(
      listingType,
      this.toGoodsCategoryDto(selectedGoodsIds, listingId, listingType),
    );
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
