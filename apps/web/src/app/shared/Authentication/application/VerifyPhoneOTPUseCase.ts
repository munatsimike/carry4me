import type { User } from "@supabase/supabase-js";
import type { AuthRepository } from "../domain/AuthRepository";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

export class VerifyPhoneOTPUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(phoneNumber: string, token: string): Promise<Result<User>> {
    const result = await this.repo.verifyPhoneOTP(phoneNumber, token);
    return toResult(result);
  }
}
