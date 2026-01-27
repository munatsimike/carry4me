import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase/client";
import { useAuthModal } from "./AuthModalContext";

export function AuthModal() {
  const { state, closeAuthModal } = useAuthModal();
  const navigate = useNavigate();

  if (!state.isOpen) return null;

  async function handleSignIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      closeAuthModal();
      if (state.redirectTo) {
        navigate(state.redirectTo);
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-[360px]">
        <h2 className="text-lg font-semibold">
          {state.mode === "signin" ? "Sign in" : "Sign up"}
        </h2>

        {/* form fields here */}
        <button
          onClick={() => handleSignIn("test@carry4me.dev", "password123")}
        >
          Continue
        </button>

        <button type="button" onClick={closeAuthModal}>
          Close
        </button>
      </div>
    </div>
  );
}
