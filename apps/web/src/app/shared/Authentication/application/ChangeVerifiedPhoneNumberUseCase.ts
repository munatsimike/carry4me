import type { AuthRepository } from "../domain/AuthRepository";

export type VerifyPhoneChangeInput = {
  userId: string;
  phoneNumber: string;
  token: string;
  countryCode: string;
};

export class ChangeVerifiedPhoneNumberUseCase {
  private readonly repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async requestVerification(phoneNumber: string): Promise<string> {
    return await this.repo.requestPhoneChange(phoneNumber);
  }

  async verifyAndUpdate(input: VerifyPhoneChangeInput): Promise<string> {
    return await this.repo.verifyPhoneChange(
      input.userId,
      input.phoneNumber,
      input.token,
      input.countryCode,
    );
  }
}
