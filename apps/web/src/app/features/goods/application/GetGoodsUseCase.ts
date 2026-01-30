import type { SupabaseGoodsRepository } from "../data/SupabaseGoodsRepository";
import type { GoodsCategory } from "../domain/GoodsCategory";

export class GetGoodsUseCase {
  repo: SupabaseGoodsRepository;

  constructor(repo: SupabaseGoodsRepository) {
    this.repo = repo;
  }

  async execute(): Promise<GoodsCategory[]> {
    const result = await this.repo.list();
        console.log(result)
    return result;
  }
}
