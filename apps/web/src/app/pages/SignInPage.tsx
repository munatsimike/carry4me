import DefaultContainer from "@/components/ui/DefualtContianer";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "../shared/supabase/AuthState";
import { supabase } from "../shared/supabase/client";

export default function SignInPage() {
  const navigate = useNavigate();
  const { userLoggedIn, authChecked } = useAuthState();

  useEffect(() => {
    if (!authChecked) return;

    if (userLoggedIn) {
      navigate("/dashboard", { replace: true });
    }
  }, [userLoggedIn, authChecked, navigate]);

  if (!authChecked) return null; // or loader

  return (
    <DefaultContainer>
      <button
        onClick={async () => {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: "test@carry4me.dev",
            password: "password123",
          });

          console.log("SIGN IN:", data, error);
        }}
      >
        Sign in test user
      </button>

      <button
        onClick={async () => {
          const { data, error } = await supabase.auth.signUp({
            email: "test@carry4me.dev",
            password: "password123",
          });

          console.log("SIGN UP:", data, error);
        }}
      >
        Create test user
      </button>
    </DefaultContainer>
  );
}
