import type { User } from "@supabase/supabase-js";
import type { AuthRepository } from "../domain/AuthRepository";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

export class LoginUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(email: string, password: string):Promise<Result<User>> {
    const result = await this.repo.login(email, password);
     return toResult(result)
  }
}
