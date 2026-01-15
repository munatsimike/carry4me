import { Link, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <div className="mx-auto max-w-container px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            <img src="/logo.png" alt="Carry4Me" className="h-12 w-auto" />
          </Link>

          <nav className="flex items-center gap-5 text-sm">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <Link to="/about" className="hover:underline">
              About
            </Link>

            <Link to="/about" className="hover:underline">
              Contact
            </Link>

            <Link to="/signin" className="rounded-md hover:bg-blue-600">
              Sign up
            </Link>
            <Link
              to="/signin"
              className="rounded-md bg-blue-500 px-4 py-1.5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-600"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
          © {new Date().getFullYear()} Carry4Me
        </div>
      </footer>
    </div>
  );
}
