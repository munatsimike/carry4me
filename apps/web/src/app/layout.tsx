import DesktopNavigationMenu, {
  BottomNavBar,
  MobileToolBar,
} from "@/Navigation";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AuthModal } from "./shared/Authentication/UI/AuthModal";
import { useAuth } from "./shared/supabase/AuthProvider";
import Footer from "./shared/Authentication/UI/Footer";
import type { UserProfile } from "./shared/Authentication/domain/authTypes";
import { useMediaQuery } from "./shared/Authentication/UI/hooks/useMediaQuery";
import { useState } from "react";
import { cn } from "./lib/cn";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "./shared/Authentication/UI/hooks/useUI";
const PATHS = ["/travelers", "/parcels", "/favourites"];
const HIDE_BOTTOM_NAV = ["/create-trip", "/create-parcel"];

export default function AppLayout() {
  const { loading, user, profile } = useAuth();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const showBottomNav = !HIDE_BOTTOM_NAV.includes(location.pathname);
  const { showBottomNavBar } = useUI();
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
      <Header
        pathname={location.pathname}
        isAuthed={isAuthed}
        profile={profile}
        setIsSearchOpen={() => setIsSearchOpen(true)}
      />
      <main className="min-h-screen flex flex-col">
        <Outlet context={{ isSearchOpen, setIsSearchOpen }} />
      </main>

      <AuthModal />
      <AnimatePresence>
        {(showBottomNav || showBottomNavBar) && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed bottom-0 left-0 right-0 border-t bg-white z-50 block sm:hidden py-2 shadow-sm backdrop-blur-md"
          >
            {<BottomNavBar isAuthed={isAuthed} />}
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
    <header className="sticky top-0 z-50 bg-white">
      <div
        className={cn(
          "relative shadow-sm sm:shadow-none mx-auto max-w-container bg-white border-b border-white/20 sm:bg-white  sm:px-4 pt-3 pb-3 flex items-center gap-3 sm:flex-row sm:items-center justify-between border-b border-r border-l border-neutral-100",
          pathname === "/" ? "pl-3 pr-4" : "pr-4",
        )}
      >
        <Link to={isAuthed ? "/dashboard" : "/"} className="font-semibold">
          {!isMobile && (
            <img src="/logo.svg" alt="Carry4Me" className="h-14 w-auto" />
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
