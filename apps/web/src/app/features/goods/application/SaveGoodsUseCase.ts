import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { SupabaseGoodsRepository } from "../data/SupabaseGoodsRepository";
import type { UserGoods } from "../domain/UserGoods";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class SaveGoodsUseCase {
  repo: SupabaseGoodsRepository;

  constructor(repo: SupabaseGoodsRepository) {
    this.repo = repo;
  }

  async execute(input: UserGoods, isTrip: boolean): Promise<Result<string>> {
    const result = await this.repo.saveGoods(input, isTrip);
    return toResult(result);
  }
}
