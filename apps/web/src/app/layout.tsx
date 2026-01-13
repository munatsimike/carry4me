import { Link, Outlet } from "react-router-dom"

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            Carry4Me
          </Link>

          <nav className="flex items-center gap-9 text-sm">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <Link to="/about" className="hover:underline">
              About
            </Link>
            <Link
              to="/signin"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-white"
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
  )
}
