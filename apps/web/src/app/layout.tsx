import Navigation from "@/Navigation";
import { Link, Outlet, useLocation } from "react-router-dom";

import { AuthModalProvider } from "./shared/Authentication/AuthModalContext";
import { AuthModal } from "./shared/Authentication/UI/AuthModal";
import { UserProfileMenu } from "./shared/Authentication/UI/userProfileMenu";
import { useEffect, useState } from "react";
import { ToastProvider } from "./components/Toast";
import { useAuth } from "./shared/supabase/AuthProvider";

export default function AppLayout() {
  const { loading, profile } = useAuth();
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const location = useLocation();
  useEffect(() => {
    if (showProfile) setShowProfile(false);
  }, [location.pathname]);

  if (loading) return null;
  
  return (
    <AuthModalProvider>
      <ToastProvider>
        <div className="min-h-screen flex flex-col">
          <header>
            <div className="relative mx-auto max-w-container px-4 py-4 flex items-center justify-between">
              <Link
                to={!!profile ? "/dashboard" : ""}
                className="font-semibold"
              >
                <img src="/logo.svg" alt="Carry4Me" className="h-14 w-auto" />
              </Link>

              <Navigation
                userLoggedIn={!!profile}
                userProfile={profile}
                setShowProfile={() => setShowProfile(!showProfile)}
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
      </ToastProvider>
    </AuthModalProvider>
  );
}
