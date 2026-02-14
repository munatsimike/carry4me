import { useToast } from "@/app/components/Toast";
import { LogoutUseCase } from "@/app/shared/Authentication/application/LogoutUseCase";
import { SupabaseAuthRepository } from "@/app/shared/data/LoginRepository";
import { isNetworkError } from "@/app/util/isNetworkError";
import CustomText from "@/components/ui/CustomText";
import { LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LogoutButton({
  onCloseProfile,
}: {
  onCloseProfile: () => void;
}) {
  const repo = useMemo(() => new SupabaseAuthRepository(), []);
  const useCase = useMemo(() => new LogoutUseCase(repo), [repo]);
  const cls = "group-hover:text-ink-error";
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const logout = async () => {
    try {
      setLoading(true);
      const result = await useCase.execute();

      if (result.success) navigate("/");
      toast("Signed out successfully.", { variant: "info" });
    } catch (error) {
      if (isNetworkError(error)) console.log("network error:", error);
      else console.log(error);
    } finally {
      setLoading(false);
      onCloseProfile();
    }
  };

  return (
    <button onClick={logout} disabled={loading}>
      <span className="group w-full inline-flex gap-2 items-center p-2 hover:bg-error-100 rounded-md">
        <LogOut className={`${"h-6 w-6 text-neutral-300 "}${cls}`} />
        <CustomText as="span" textVariant="primary" className={cls}>
          {loading ? "Signing out..." : "Sign out"}
        </CustomText>
      </span>
    </button>
  );
}
