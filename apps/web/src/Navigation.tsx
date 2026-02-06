import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthModal } from "./app/shared/Authentication/AuthModalContext";

import { SupabaseAuthRepository } from "./app/features/login/data/LoginRepository";

import { LogoutUseCase } from "./app/features/login/application/LogoutUseCase";
import { useMemo, useState } from "react";
import { useAsync } from "./app/hookes/useAsync";
import { isNetworkError } from "./app/util/isNetworkError";

export default function Navigation({
  userLoggedIn,
  authChecked,
}: {
  userLoggedIn: boolean;
  authChecked: boolean;
}) {
  if (!authChecked) {
    return <GuestNavigation />;
  }
  return userLoggedIn ? <AuthenticatedNavigation /> : <GuestNavigation />;
}

function NavLinks({ children }: { children: React.ReactNode }) {
  return <nav className="flex items-center gap-5 text-sm">{children}</nav>;
}

function GuestNavigation() {
  const { openAuthModal } = useAuthModal();
  const location = useLocation();

  return (
    <NavLinks>
      <Home />
      <NavItem to="/about">About</NavItem>
      <NavItem to="/about">Contact</NavItem>
      <button
        onClick={() =>
          openAuthModal({
            mode: "signup",
            redirectTo: location.pathname,
          })
        }
        className="text-sm font-medium text-gray-700 hover:text-blue-600"
      >
        Sign up
      </button>

      <button
        onClick={() =>
          openAuthModal({
            mode: "signin",
            redirectTo: location.pathname,
          })
        }
        className="rounded-md bg-blue-500 px-4 py-1.5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-600"
      >
        Sign in
      </button>
    </NavLinks>
  );
}

function AuthenticatedNavigation() {
  const [showProfile, setShowProfile] = useState<boolean>(false);
  return (
    <NavLinks>
      <Home />
      <NavItem to="/dashboard">Dashboard</NavItem>
      <NavItem to="/travelers">Trips</NavItem>
      <NavItem to="/parcels">Parcels</NavItem>
      <NavItem to="/requests">Requests</NavItem>
      <span className=" relative inline-flex flex-col">
        <button onClick={() => setShowProfile(!showProfile)}>
          <img
            src="/avatar.svg"
            alt="User profile"
            className="rounded-full h-9 w-9 border border-neutral-50"
          />
        </button>
        {showProfile && <LogoutButton />}
      </span>
    </NavLinks>
  );
}

function LogoutButton() {
  const navigate = useNavigate();

  const repo = useMemo(() => new SupabaseAuthRepository(), []);
  const useCase = useMemo(() => new LogoutUseCase(repo), [repo]);

  const [loading, setLoading] = useState(false);

  const logout = async () => {
    try {
      setLoading(true);
      const result = await useCase.execute();

      if (result.success) navigate("/");
    } catch (error) {
      if (isNetworkError(error)) console.log("network error:", error);
      else console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="absolute top-10 flex shadow-md rounded-md border border-error-500 p-5 max-w-sm">
      <button onClick={logout} disabled={loading}>
        {loading ? "Signing out..." : "Sign out"}
      </button>
    </span>
  );
}

function Home() {
  return (
    <NavItem to="/" end={true}>
      Home
    </NavItem>
  );
}

type NavItemProps = {
  end?: boolean;
  to: string;
  children: React.ReactNode;
};

function NavItem({ to, children, end = false }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative pb-1 ${
          isActive
            ? "text-primary-600 font-medium"
            : "text-neutral-800 hover:text-primary-600"
        }`
      }
      end={end}
    >
      {children}
    </NavLink>
  );
}
