/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1F4E79",
          50: "#F0F5FA",
          100: "#D9E6F2",
          200: "#B3CEE6",
          300: "#8DB6DA",
          400: "#5792C7",
          500: "#1F4E79",
          600: "#184064",
          700: "#12314D",
          800: "#0C2236",
          900: "#06131F"
        },
        ink: {
          DEFAULT: "#0F172A",
          dark: "#F8FAFC"
        },
        cloud: {
          DEFAULT: "#F8FAFC",
          dark: "#0B1120"
        },
        line: {
          DEFAULT: "#E2E8F0",
          dark: "#1E293B"
        }
      },
      fontFamily: {
        sans: ["Cairo", "Tajawal", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
