import { useMutation } from "@tanstack/react-query";
import {
  ChangeVerifiedPhoneNumberUseCase,
  type VerifyPhoneChangeInput,
} from "@/app/shared/Authentication/application/ChangeVerifiedPhoneNumberUseCase";
import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";

const authRepository = new SupabaseAuthRepository();
const changeVerifiedPhoneNumberUseCase = new ChangeVerifiedPhoneNumberUseCase(
  authRepository,
);

export function useRequestPhoneChangeMutation() {
  return useMutation({
    mutationFn: (phoneNumber: string) =>
      changeVerifiedPhoneNumberUseCase.requestVerification(phoneNumber),
  });
}

export function useVerifyPhoneChangeMutation() {
  return useMutation({
    mutationFn: (input: VerifyPhoneChangeInput) =>
      changeVerifiedPhoneNumberUseCase.verifyAndUpdate(input),
  });
}
