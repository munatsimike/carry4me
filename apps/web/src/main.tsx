import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import "./index.css";
import { AuthProvider } from "./app/shared/supabase/AuthProvider";
import { ToastProvider } from "./app/components/Toast";

// main.tsx

if (import.meta.env.DEV) {
  window.addEventListener("unhandledrejection", (e) => {
    console.error("UNHANDLED PROMISE REJECTION:", e.reason);
  });

  window.addEventListener("error", (e) => {
    console.error("WINDOW ERROR:", e.error || e.message);
  });
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);