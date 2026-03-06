import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { GoodsRepository } from "../domain/GoodsRepository";
import type { EditGoodsDto } from "./EditGoodsDto";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class EditGoodsUsecase {
  repo: GoodsRepository;
  constructor(repo: GoodsRepository) {
    this.repo = repo;
  }

  async execute(
    SelectedGoodsIds: string[],
    parcel_id: string,
  ): Promise<Result<string>> {
    const result = await this.repo.editParcel(
      this.toGoodsDto(SelectedGoodsIds, parcel_id),
    );
    return toResult(result);
  }

  toGoodsDto(goods: string[], parcel_id: string): EditGoodsDto[] {
    return goods.map((id: string) => ({
      parcel_id: parcel_id,
      category_id: id,
    }));
  }
}
