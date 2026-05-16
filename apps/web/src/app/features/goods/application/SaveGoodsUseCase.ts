import type { SupabaseGoodsRepository } from "../data/SupabaseGoodsRepository";
import type { UserGoods } from "../domain/UserGoods";

export class SaveGoodsUseCase {
  repo: SupabaseGoodsRepository;

  constructor(repo: SupabaseGoodsRepository) {
    this.repo = repo;
  }

  async execute(input: UserGoods, isTrip: boolean): Promise<string> {
    return await this.repo.saveGoods(input, isTrip);
  }
}
