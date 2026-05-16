import type { User } from "@supabase/supabase-js";
import type { AuthRepository } from "../domain/AuthRepository";

export class VerifyPhoneOTPUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(phoneNumber: string, token: string): Promise<User> {
    return await this.repo.verifyPhoneOTP(phoneNumber, token);
  }
}
