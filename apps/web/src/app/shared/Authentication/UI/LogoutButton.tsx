import { LogoutUseCase } from "@/app/features/login/application/LogoutUseCase";
import { SupabaseAuthRepository } from "@/app/features/login/data/LoginRepository";
import { isNetworkError } from "@/app/util/isNetworkError";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const repo = useMemo(() => new SupabaseAuthRepository(), []);
  const useCase = useMemo(() => new LogoutUseCase(repo), [repo]);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      setLoading(true);
      const result = await useCase.execute();

      if (result.success) navigate("/");
    } catch (error) {
      if (isNetworkError(error)) console.log("network error:", error);
      else console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={logout}
      className="absolute top-10 flex shadow-md rounded-md border border-error-500 p-5 max-w-md"
      disabled={loading}
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
