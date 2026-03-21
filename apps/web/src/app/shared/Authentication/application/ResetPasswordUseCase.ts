import type { AuthRepository } from "../domain/AuthRepository";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

export class ResetPasswordUseCase{
    repo: AuthRepository
    constructor(repo: AuthRepository){
        this.repo =repo
    }

   async execute(email:string): Promise<Result<string>>{
       const result = await this.repo.resetPassword(email)
       return toResult(result)
    }
}