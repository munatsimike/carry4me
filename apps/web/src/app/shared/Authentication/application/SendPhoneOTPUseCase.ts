import type { AuthRepository } from "../domain/AuthRepository";

export class SendPhoneOTPUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(phoneNumber: string): Promise<string> {
    return await this.repo.sendPhoneOTP(phoneNumber);
  }
}
