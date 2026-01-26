import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "../shared/supabase/AuthState";
import DefaultContainer from "@/components/ui/DefualtContianer";
import PageSection from "../components/PageSection";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userLoggedIn, authChecked } = useAuthState();

  useEffect(() => {
    if (!authChecked) return;

    if (!userLoggedIn) {
      navigate("/signin", { replace: true });
    }
  }, [userLoggedIn, authChecked, navigate]);

  if (!authChecked) return null;

  return (
    <DefaultContainer>
      <PageSection>
        <div>Dashboard content</div>
      </PageSection>
    </DefaultContainer>
  );
}
