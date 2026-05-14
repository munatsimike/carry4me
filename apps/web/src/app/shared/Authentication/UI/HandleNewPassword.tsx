import { useForm } from "react-hook-form";
import DefaultContainer from "@/components/ui/DefualtContianer";
import CustomText from "@/components/ui/CustomText";
import FloatingInputField from "@/app/components/CustomInputField";
import { Button } from "@/components/ui/Button";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import { namedCall } from "../application/NamedCall";
import { Card } from "@/app/components/card/Card";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import { NewPasswordUseCase } from "./NewPasswordUseCase";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], //  attaches error to confirmPassword
  });

type FormValues = z.infer<typeof passwordSchema>;
export default function NewPassword() {
  const {
    reset,
    register,
    handleSubmit,
    watch,
    formState: { errors, dirtyFields, touchedFields },
  } = useForm<FormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const password = watch("password");
  const repo = useMemo(() => new SupabaseAuthRepository(), []);
  const newPasswordUseCase = useMemo(
    () => new NewPasswordUseCase(repo),
    [repo],
  );

  const { showSupabaseError } = useUniversalModal();
  const navigate = useNavigate();

  const handleUpdatePassword = async (values: FormValues) => {
    const { result } = await namedCall(
      "new password",
      newPasswordUseCase.execute(values.password),
    );

    if (!result.success) {
      showSupabaseError(result.error);
    } else {
      reset();
      navigate("/?reset=success", {
        replace: true,
      });
    }
  };

  return (
    <DefaultContainer outerClassName="flex bg-canvas min-h-screen justify-center">
      <CustomText
        textSize="xl"
        textVariant="primary"
        className="pl-4 pb-2 sm:pb-4 font-medium"
      >
        Reset password
      </CustomText>
      <Card className="mx-auto w-full sm:max-w-xl">
        <div className="mx-auto w-full sm:w-[400px] md:w-[460px] lg:w-[500px] p-6">
          <div className="mb-6 space-y-2 text-center">
            <CustomText textVariant="primary" textSize="xl">
              Enter a new password
            </CustomText>

            <CustomText textVariant="secondary" textSize="sm">
              Enter your new password below.
            </CustomText>
          </div>

          <form
            onSubmit={handleSubmit(handleUpdatePassword)}
            className="mx-auto flex w-full  flex-col gap-5 items-center"
          >
            <FloatingInputField
              hasValue={!!password}
              className="w-full sm:w-80"
              label="New password"
              type="password"
              error={errors.password?.message}
              isDirty={!!dirtyFields.password}
              isTouched={!!touchedFields.password}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Minimum 6 characters",
                },
              })}
            />

            <FloatingInputField
              hasValue={!!watch("confirmPassword")}
              className="w-full sm:w-80"
              label="Confirm password"
              type="password"
              error={errors.confirmPassword?.message}
              isDirty={!!dirtyFields.confirmPassword}
              isTouched={!!touchedFields.confirmPassword}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />

            <span className="w-full pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
              >
                <CustomText textVariant="onDark">Update password</CustomText>
              </Button>
            </span>
          </form>
        </div>
      </Card>
    </DefaultContainer>
  );
}
