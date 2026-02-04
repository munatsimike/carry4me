import type { GoodsCategory } from "../domain/GoodsCategory";
import type { GoodsRepository } from "../domain/GoodsRepository";

export class GetGoodsUseCase {
  repo: GoodsRepository;

  constructor(repo: GoodsRepository) {
    this.repo = repo;
  }

  async execute(): Promise<GoodsCategory[]> {
    const result = await this.repo.list();
    return result;
  }
}
