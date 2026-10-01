/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Kantumruy Pro"', 'Inter', 'Poppins', 'sans-serif'],
        khmer: ['"Kantumruy Pro"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
