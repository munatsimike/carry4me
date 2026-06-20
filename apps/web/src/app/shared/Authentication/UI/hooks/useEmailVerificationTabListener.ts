import { subscribeToEmailVerificationRequests } from "@/app/shared/Authentication/application/emailVerificationTabCoordination";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useEmailVerificationTabListener() {
  const navigate = useNavigate();

  useEffect(() => {
    return subscribeToEmailVerificationRequests((message) => {
      navigate(message.path);
    });
  }, [navigate]);
}
