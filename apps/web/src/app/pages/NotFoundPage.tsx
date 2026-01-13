import { Link } from "react-router-dom"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="mt-2 text-slate-600">That page doesn’t exist.</p>
        <Link
          to="/"
          className="inline-block mt-4 underline text-blue-600"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}
