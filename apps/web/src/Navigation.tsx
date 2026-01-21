import { Link, NavLink } from "react-router-dom";

export default function Navigation({
  userLoggedIn,
}: {
  userLoggedIn: boolean;
}) {
  return userLoggedIn ? <AuthenticatedNavigation /> : <GuestNavigation />;
}

function NavLinks({ children }: { children: React.ReactNode }) {
  return <nav className="flex items-center gap-5 text-sm">{children}</nav>;
}

function GuestNavigation() {
  return (
    <NavLinks>
      <Home />
      <NavItem to="/about">About</NavItem>
      <NavItem to="/about">Contact</NavItem>
      <NavItem to="/signin">Sign up</NavItem>
      <Link
        to="/signin"
        className="rounded-md bg-blue-500 px-4 py-1.5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-600"
      >
        Sign in
      </Link>
    </NavLinks>
  );
}

function AuthenticatedNavigation() {
  return (
    <NavLinks>
      <Home />
      <NavItem to="/dashboard">Dashboard</NavItem>
      <NavItem to="/parcels">Parcels</NavItem>
      <NavItem to="/travelers">Trips</NavItem>
      <Link to="">
        <img
          src="/avatar.svg"
          alt="User profile"
          className="rounded-full h-9 w-9 border border-neutral-50"
        />
      </Link>
    </NavLinks>
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
