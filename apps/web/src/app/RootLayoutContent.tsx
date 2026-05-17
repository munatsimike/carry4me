import DesktopNavigationMenu, {
  BottomNavBar,
  MobileToolBar,
} from "@/Navigation";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./shared/supabase/AuthProvider";
import Footer from "./shared/Authentication/UI/Footer";
import type { UserProfile } from "./shared/Authentication/domain/authTypes";
import { COMPLETE_PROFILE_PATH } from "./shared/Authentication/domain/profileCompletion";
import { useMediaQuery } from "./shared/Authentication/UI/hooks/useMediaQuery";
import { useEffect, useState } from "react";
import { cn } from "./lib/cn";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "./shared/Authentication/UI/hooks/useUI";
import { PhoneVerificationModal } from "./shared/Authentication/UI/PhoneVerificationModal";
const PATHS = ["/travelers", "/parcels", "/favourites"];
const PUBLIC_WHILE_INCOMPLETE = new Set([
  "/",
  "/about",
  "/signin",
  "/travelers",
  "/parcels",
  COMPLETE_PROFILE_PATH,
]);

export default function RootLayoutContent() {
  const { loading, user, profile, profileIncomplete } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { showBottomNavBar } = useUI();
  const isAuthed = !!user;

  useEffect(() => {
    if (loading || !user || !profileIncomplete) return;
    if (PUBLIC_WHILE_INCOMPLETE.has(location.pathname)) return;

    navigate(COMPLETE_PROFILE_PATH, {
      replace: true,
      state: { from: location.pathname },
    });
  }, [loading, user, profileIncomplete, location.pathname, navigate]);

  // Show phone verification modal if user is logged in and phone is not verified

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
      <Header
        pathname={location.pathname}
        isAuthed={isAuthed}
        profile={profile}
        setIsSearchOpen={() => setIsSearchOpen(true)}
      />

      <main className="min-h-screen flex flex-col pb-16 sm:pb-0">
        <Outlet context={{ isSearchOpen, setIsSearchOpen }} />
      </main>

      <PhoneVerificationModal />

      <AnimatePresence>
        {showBottomNavBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed bottom-0 left-0 right-0 z-50 block border-t bg-white py-2 shadow-sm backdrop-blur-md sm:hidden"
          >
            <BottomNavBar isAuthed={isAuthed} />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer isAuthed={isAuthed} />
    </div>
  );
}

function Header({
  isAuthed,
  profile,
  setIsSearchOpen,
  pathname,
}: {
  pathname: string;
  isAuthed: boolean;
  profile: UserProfile | null;
  setIsSearchOpen: () => void;
}) {
  const showSearchBar = PATHS.includes(pathname);
  const isMobile = useMediaQuery();

  return (
    <header className="sticky top-0 z-50 border border-slate-100 bg-white shadow-sm">
      <div
        className={cn(
          "relative mx-auto flex min-h-14 max-w-container items-center justify-between gap-3 bg-white px-3 py-2 shadow-sm sm:min-h-16 sm:px-4 sm:shadow-none",
          pathname === "/" ? "pr-4" : "pr-3 sm:pr-4",
        )}
      >
        <Link to={isAuthed ? "/dashboard" : "/"} className="hidden shrink-0 font-semibold sm:block">
          {!isMobile && (
            <img src="/logo.svg" alt="Carry4Me" className="h-12 w-auto" />
          )}
        </Link>

        <div className="hidden sm:flex">
          <DesktopNavigationMenu
            userLoggedIn={isAuthed}
            userProfile={profile} // can be null sometimes, that's ok
          />
        </div>

        <MobileToolBar
          showSearchBar={showSearchBar}
          isAuthed={isAuthed}
          profile={profile}
          setIsSearchOpen={setIsSearchOpen}
        />
      </div>
    </header>
  );
}
