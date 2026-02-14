import Navigation from "@/Navigation";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthState } from "./shared/supabase/AuthState";
import { AuthModalProvider } from "./shared/Authentication/AuthModalContext";
import { AuthModal } from "./shared/Authentication/UI/AuthModal";
import { UserProfileMenu } from "./shared/Authentication/UI/userProfileMenu";
import { useEffect, useState } from "react";

export default function AppLayout() {
  const { authChecked, userLoggedIn } = useAuthState();
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    if (showProfile) setShowProfile(false);
  }, [location.pathname]);

  return (
    <AuthModalProvider>
      <div className="min-h-screen flex flex-col">
        <header>
          <div className="relative mx-auto max-w-container px-4 py-4 flex items-center justify-between">
            <Link
              to={userLoggedIn ? "/dashboard" : ""}
              className="font-semibold"
            >
              <img src="/logo.svg" alt="Carry4Me" className="h-14 w-auto" />
            </Link>

            <Navigation
              userLoggedIn={userLoggedIn}
              authChecked={authChecked}
              userProfile={{
                setShowProfile: setShowProfile,
                showProfile: showProfile,
              }}
            />
            {showProfile && (
              <UserProfileMenu onCloseProfile={() => setShowProfile(false)} />
            )}
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
        <AuthModal />

        <footer className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
            © {new Date().getFullYear()} Carry4Me
          </div>
        </footer>
      </div>
    </AuthModalProvider>
  );
}
