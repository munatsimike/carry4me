import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { GoodsCategory } from "../domain/GoodsCategory";
import type { GoodsRepository } from "../domain/GoodsRepository";
import type { Result } from "@/app/shared/Authentication/domain/Result";

export class GetGoodsUseCase {
  repo: GoodsRepository;

  constructor(repo: GoodsRepository) {
    this.repo = repo;
  }

  async execute(): Promise<Result<GoodsCategory[]>> {
    const result = await this.repo.list();
    return toResult(result);
  }
}
