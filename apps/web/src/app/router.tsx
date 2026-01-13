
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layout";
import NotFoundPage from "./pages/NotFoundPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import SignInPage from "./pages/SignInPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout/>,
    errorElement: <NotFoundPage/>,
    children:[
      {index: true, element: <HomePage/>},
      {path: "about", element: <AboutPage/>},
      {path: "signin", element: <SignInPage />}
    ]
  }
]
)
