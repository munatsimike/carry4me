import Navigation from "@/Navigation";
import { Link, Outlet, useLocation } from "react-router-dom";

import { AuthModal } from "./shared/Authentication/UI/AuthModal";
import { UserProfileMenu } from "./shared/Authentication/UI/userProfileMenu";
import { useEffect, useState } from "react";

import { useAuth } from "./shared/supabase/AuthProvider";

export default function AppLayout() {
  const { loading, user, profile } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setShowProfile(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-neutral-200" />
          <div className="absolute inset-0 rounded-full border-4 border-black border-t-transparent animate-spin" />
        </div>

        <p className="text-sm text-neutral-500 tracking-wide">
          Loading your account...
        </p>
      </div>
    );
  }

  const isAuthed = !!user;

  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <div className="relative mx-auto max-w-container px-4 py-4 flex items-center justify-between">
          <Link to={isAuthed ? "/dashboard" : "/"} className="font-semibold">
            <img src="/logo.svg" alt="Carry4Me" className="h-14 w-auto" />
          </Link>

          <Navigation
            userLoggedIn={isAuthed}
            userProfile={profile} // can be null sometimes, that's ok
            setShowProfile={() => setShowProfile((s) => !s)}
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
  );
}
