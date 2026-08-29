/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050B18",
          900: "#0A1630",
          800: "#0F1F42",
          700: "#152A56",
          600: "#1D3A73",
          500: "#28508F",
        },
        gold: {
          500: "#C89B3C",
          400: "#D6AF5C",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
