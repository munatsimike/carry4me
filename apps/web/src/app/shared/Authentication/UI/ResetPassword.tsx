import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import { useMemo } from "react";
import { ResetPasswordUseCase } from "../application/ResetPasswordUseCase";
import { namedCall } from "../application/NamedCall";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import DefaultContainer from "@/components/ui/DefualtContianer";
import FloatingInputField from "@/app/components/CustomInputField";
import { motion } from "framer-motion";
import { Card } from "@/app/components/card/Card";
import { useAuthModal } from "../AuthModalContext";

const emailSchema = z.object({
  emailAddress: z
    .string()
    .min(1, "Email is required")
    .toLowerCase()
    .pipe(z.email({ message: "Enter a valid email" })),
});

type EmailField = z.infer<typeof emailSchema>;

export default function ResetPassword() {
  const {
    handleSubmit,
    register,
    watch,
    resetField,
    formState: { dirtyFields, touchedFields, errors },
  } = useForm<EmailField>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      emailAddress: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const emailAddress = watch("emailAddress");
  const repo = useMemo(() => new SupabaseAuthRepository(), []);
  const resetPasswordUseCase = useMemo(
    () => new ResetPasswordUseCase(repo),
    [repo],
  );
  const { openAuthModal } = useAuthModal();

  const handleReset = async (values: EmailField) => {
    const { result } = await namedCall(
      "reset password",
      resetPasswordUseCase.execute(values.emailAddress),
    );

    if (!result.success) {
      alert(result.error);
    } else {
      resetField("emailAddress");
      alert("Check your email address for the reset link.");
    }
  };

  return (
    <DefaultContainer outerClassName="flex bg-canvas min-h-screen justify-center">
      <Card>
        <motion.div className="w-full max-w-md p-6">
          <div className="mb-6 space-y-2 text-center">
            <CustomText textVariant="primary" textSize="xl">
              Reset password
            </CustomText>
            <CustomText textVariant="secondary" textSize="sm">
              Enter your email address and we’ll send you a link to reset your
              password.
            </CustomText>
          </div>

          <form onSubmit={handleSubmit(handleReset)} className="space-y-6">
            <FloatingInputField
              hasValue={!!emailAddress}
              className="w-full"
              label="Email address"
              type="email"
              error={errors.emailAddress?.message}
              isDirty={!!dirtyFields.emailAddress}
              isTouched={!!touchedFields.emailAddress}
              {...register("emailAddress")}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
            >
              <CustomText textVariant="onDark">Send reset link</CustomText>
            </Button>
          </form>

          <div className="mt-2 text-center">
            <CustomText textVariant="secondary" textSize="sm">
              Remembered your password?{" "}
              <button
                onClick={() =>
                  openAuthModal({
                    mode: "signin",
                  })
                }
              >
                <CustomText
                  as="span"
                  textVariant="linkText"
                  className="cursor-pointer"
                >
                  Sign in
                </CustomText>
              </button>
            </CustomText>
          </div>
        </motion.div>
      </Card>
    </DefaultContainer>
  );
}
