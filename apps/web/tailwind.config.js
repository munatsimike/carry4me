/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      // ...your existing extend
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 250ms ease-out",
        "scale-in": "scale-in 250ms ease-out",
        "slide-up-fade": "slide-up-fade 250ms ease-out",
      },
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6", // main brand blue
          600: "#2563EB",
          700: "#1D4ED8",
        },
        secondary: {
          50: "#E6F1FF",
          100: "#D8E9FF",
          200: "#C2DCFF",
          300: "#9FC4FF",
          500: "#4F5B67",
        },
        tertiary: {
          50: "#E8EBEE",
          100: "#D0D7DE",
        },

        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },

        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },

        ink: {
          primary: "#0A2148",
          secondary: "#4F5B67",
          success: "#10B981",
          onDark: "#ffff",
          error: "#EF4444",
        },

        canvas: "#FAFBFC",

        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA", // main error
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
        },

        status: {
          pending: "#F59E0B",
          success: "#10B981",
          inactive: "#EF4444",
        },

        neutral: {
          50: "#FAFBFC", // lightest
          100: "#F4F6F8",
          200: "#E6E9EE",
          300: "#D0D5DD",
          400: "#98A2B3",
          500: "#667085",
          600: "#475467",
          700: "#344054",
          800: "#1D2939",
          900: "#101828", // darkest
        },
      },

      fontFamily: {
        heading: ["DM Sans", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        container: "1200px",
      },
    },
  },

  plugins: [],
};
