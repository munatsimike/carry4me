import DesktopNavigationMenu, { MobileNavigationMenu } from "@/Navigation";
import { Link, Outlet } from "react-router-dom";
import { AuthModal } from "./shared/Authentication/UI/AuthModal";
import { useAuth } from "./shared/supabase/AuthProvider";
import Footer from "./shared/Authentication/UI/Footer";
import type { UserProfile } from "./shared/Authentication/domain/authTypes";
import { useMediaQuery } from "./shared/Authentication/UI/useMediaQuery";

export default function AppLayout() {
  const { loading, user, profile } = useAuth();

  const isAuthed = !!user;
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthed={isAuthed} profile={profile} />
      <main className="min-h-screen flex flex-col">
        <Outlet />
      </main>

      <AuthModal />

      <Footer isAuthed={isAuthed} />
    </div>
  );
}

function Header({
  isAuthed,
  profile,
}: {
  isAuthed: boolean;
  profile: UserProfile | null;
}) {
  
  const isMobile = useMediaQuery()
  return (
    <header className="sticky top-0 z-50 bg-white ">
      <div className="relative shadow-sm sm:shadow-none mx-auto max-w-container rounded-lg px-4 pt-3 pb-3 flex items-center gap-3 sm:flex-row sm:items-center justify-between border-b border-r border-l border-neutral-100">
        <Link to={isAuthed ? "/dashboard" : "/"} className="font-semibold">
         { !isMobile &&
          <img src="/logo.svg" alt="Carry4Me" className="h-14 w-auto" />
           }
        </Link>

        <div className="hidden sm:flex">
          <DesktopNavigationMenu
            userLoggedIn={isAuthed}
            userProfile={profile} // can be null sometimes, that's ok
          />
        </div>
        <MobileNavigationMenu isAuthed={isAuthed} profile={profile}/>
       
      </div>
    </header>
  );
}
