/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Kantumruy Pro"', "Inter", "system-ui", "sans-serif"],
        khmer: ['"Kantumruy Pro"', "sans-serif"],
      },
      colors: {
        brand: {
          navy: "#0F2A4A",
          deep: "#091E36",
          accent: "#2563EB",
          gold: "#D4A373",
          "gold-muted": "#C58F58",
          surface: {
            light: "#F8FAFC",
            dark: "#090E17",
          },
          card: {
            light: "#FFFFFF",
            dark: "#111A2E",
          },
          border: {
            light: "#E2E8F0",
            dark: "#1E293B",
          },
        },
        status: {
          available: "#10B981",
          occupied: "#EF4444",
          reserved: "#3B82F6",
          maintenance: "#F59E0B",
        },
      },
      borderRadius: {
        brand: "10px",
        "brand-lg": "12px",
      },
    },
  },
  plugins: [],
};
