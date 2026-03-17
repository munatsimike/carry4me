import { LogoutUseCase } from "@/app/shared/Authentication/application/LogoutUseCase";
import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";
import { isNetworkError } from "@/app/util/isNetworkError";
import CustomText from "@/components/ui/CustomText";
import { LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LogoutButton({
 onClosePopOver,
}: {
  onClosePopOver: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const repo = useMemo(() => new SupabaseAuthRepository(), []);
  const useCase = useMemo(() => new LogoutUseCase(repo), [repo]);
  const cls = "group-hover:text-ink-error";
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    setLoading(true);
    const result = await useCase.execute();

    if (result.success) {
      sessionStorage.setItem(
        "redirectToast",
        JSON.stringify({
          message: "Signed out successfully.",
          variant: "success",
        }),
      );
      navigate("/", {
        replace: true,
      });
    }
    if (!result.success) {
      if (isNetworkError(result.error))
        console.log("network error:", result.error);
      else console.log(result.error);

      setLoading(false);
      onClosePopOver(false);
    }
  };

  return (
    <button onClick={logout} disabled={loading}>
      <span className="group w-full inline-flex gap-2 items-center p-2 hover:bg-error-100 rounded-md">
        <LogOut
          className={`${"h-6 w-6 text-neutral-400 "}${cls}`}
          strokeWidth={1.5}
        />
        <CustomText as="span" textVariant="primary" className={cls}>
          {loading ? "Signing out..." : "Sign out"}
        </CustomText>
      </span>
    </button>
  );
}
