/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6", // main brand blue
          600: "#2563EB",
          700: "#1D4ED8",
        },
        secondary: {
          50: "#E6F1FF",
          100: "#D8E9FF",
        },
        tertiary: {
          50: "#E8EBEE",
          100: "#D0D7DE",
        },

        trip: {
          50: "#D8F5E8",
          100: "#C1F0DB",
          500: "#0DBF6F",
          600: "#12B76D",
        },

        ink: {
          primary: "#0A2148",
          secondary: "#4F5B67",
        },

        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444", // main error
          600: "#DC2626",
          700: "#B91C1C",
        },

        neutral: {
          50: "#F2F4F7",
          100: "#64748B",
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
