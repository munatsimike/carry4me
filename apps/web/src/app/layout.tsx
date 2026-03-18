import Navigation from "@/Navigation";
import { Link, Outlet } from "react-router-dom";
import { AuthModal } from "./shared/Authentication/UI/AuthModal";
import { useAuth } from "./shared/supabase/AuthProvider";

export default function AppLayout() {
  const { loading, user, profile } = useAuth();

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
          />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <AuthModal />

      <footer className="border-t border-slate-300 bg-[#EAF2FF] text-slate-600">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.35fr_0.7fr_0.7fr_1fr] lg:gap-14">
            {/* Brand */}
            <div>
              <Link
                to={isAuthed ? "/dashboard" : "/"}
                className="inline-flex items-center"
              >
                <img src="/logo.svg" alt="Carry4Me" className="h-14 w-auto" />
              </Link>

              <p className="mt-5 max-w-sm text-[15px] leading-8 text-slate-700">
                Send and receive items through trusted travelers. Fast,
                affordable, and community-powered.
              </p>

              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Trusted connections • Smarter delivery • Community powered
              </p>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-700">
                <a
                  href="#"
                  className="transition-colors duration-200 hover:text-slate-900"
                >
                  Twitter
                </a>
                <a
                  href="#"
                  className="transition-colors duration-200 hover:text-slate-900"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="transition-colors duration-200 hover:text-slate-900"
                >
                  Facebook
                </a>
              </div>
            </div>
            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-slate-900">
                Product
              </h4>

              <ul className="mt-5 space-y-3.5 text-[15px]">
                <li>
                  <a
                    href="/browse/trips"
                    className="transition-colors duration-200 hover:text-slate-900"
                  >
                    Find Travelers
                  </a>
                </li>
                <li>
                  <a
                    href="/browse/parcels"
                    className="transition-colors duration-200 hover:text-slate-900"
                  >
                    Send a Parcel
                  </a>
                </li>
                <li>
                  <a
                    href="/how-it-works"
                    className="transition-colors duration-200 hover:text-slate-900"
                  >
                    How it Works
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-slate-900">
                Company
              </h4>

              <ul className="mt-5 space-y-3.5 text-[15px]">
                <li>
                  <a
                    href="/about"
                    className="transition-colors duration-200 hover:text-slate-900"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="transition-colors duration-200 hover:text-slate-900"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/faq"
                    className="transition-colors duration-200 hover:text-slate-900"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            {/* Locations */}
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-slate-900">
                Locations
              </h4>

              <ul className="mt-5 space-y-5">
                <li>
                  <p className="text-[15px] font-semibold text-slate-900">
                    Netherlands
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Haarlem / Amsterdam
                    <br />
                    <span className="text-[12px]">(Head Office)</span>
                  </p>
                </li>

                <li>
                  <p className="text-[15px] font-semibold text-slate-900">
                    United Kingdom
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    London
                    <br />
                    <span className="text-[12px]">Local Representative</span>
                  </p>
                </li>

                <li>
                  <p className="text-[15px] font-semibold text-slate-900">
                    United States
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    New York / Atlanta
                    <br />
                    <span className="text-[12px]">Local Representative</span>
                  </p>
                </li>
              </ul>

              <p className="mt-6 text-xs font-medium text-slate-500">
                Operating across Europe, UK & USA
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-300">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between lg:px-8">
            <span>
              © {new Date().getFullYear()} Carry4Me. All rights reserved.
            </span>

            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <a
                href="/privacy"
                className="transition-colors duration-200 hover:text-slate-900"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="transition-colors duration-200 hover:text-slate-900"
              >
                Terms of Service
              </a>
              <a
                href="/safety"
                className="transition-colors duration-200 hover:text-slate-900"
              >
                Safety Guidelines
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
