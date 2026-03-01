import type { AuthRepository } from "../domain/AuthRepository";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";
import type { UpdateAuthDto } from "./UpdateAuthDto";

export class UpdateAuthDetailsUseCase {
  repo: AuthRepository;
  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async excute(email?: string, password?: string): Promise<Result<string>> {
    const result = await this.repo.updateAuthDetails(
      this.toUpdateAuthDto(email, password),
    );
    return toResult(result);
  }

  toUpdateAuthDto(
    email: string | undefined,
    password: string | undefined,
  ): Partial<UpdateAuthDto> {
    const dto: UpdateAuthDto = {};

    if (email) {
      dto.email = email;
    }
    if (password) {
      dto.password = password;
    }

    if (Object.keys(dto).length === 0) throw Error;
    return dto;
  }
}
