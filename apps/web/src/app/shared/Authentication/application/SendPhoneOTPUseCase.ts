import type { AuthRepository } from "../domain/AuthRepository";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

export class SendPhoneOTPUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(phoneNumber: string): Promise<Result<string>> {
    const result = await this.repo.sendPhoneOTP(phoneNumber);
    return toResult(result);
  }
}
