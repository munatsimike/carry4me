import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layout";
import NotFoundPage from "./pages/NotFoundPage";
import HomePage from "./pages/home/HomePage";
import AboutPage from "./pages/AboutPage";
import SignInPage from "./pages/SignInPage";
import TravelersPage from "./pages/travelers/TravelersPage";
import ParcelsPage from "./pages/parcels/ParcelsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "signin", element: <SignInPage /> },
      { path: "travelers", element: <TravelersPage /> },
      { path: "parcels", element: <ParcelsPage /> },
    ],
  },
]);
