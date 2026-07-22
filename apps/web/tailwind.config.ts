import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // earthy Madhura palette
        forest: { DEFAULT: "#2f3a22", 50: "#f4f6ef", 100: "#e4e9d8", 200: "#c8d3ae", 300: "#a7b781", 400: "#87995c", 500: "#697c42", 600: "#516132", 700: "#3f4d2e", 800: "#33402a", 900: "#2f3a22", 950: "#161d10" },
        olive: { DEFAULT: "#697c42", light: "#a7b781" },
        cream: { DEFAULT: "#f7f4ee", warm: "#fbf8f1" },
        ivory: "#fffdf8",
        sand: { DEFAULT: "#e5decf", dark: "#d4c9b0" },
        gold: { DEFAULT: "#b98d3e", light: "#d4af64", dark: "#96702c" },
        copper: "#a86b48",
        bark: "#4a4038",
        ink: "#2b2a24",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(47, 58, 34, 0.18)",
        card: "0 4px 24px -8px rgba(47, 58, 34, 0.12)",
        lift: "0 18px 45px -15px rgba(47, 58, 34, 0.28)",
      },
      borderRadius: { organic: "1.5rem" },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: { float: "float 6s ease-in-out infinite" },
    },
  },
  plugins: [],
} satisfies Config;
