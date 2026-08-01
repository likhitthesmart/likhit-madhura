import type { Config } from "tailwindcss";

// Theme-aware tokens read CSS variables (channel triplets, so `/opacity` still works);
// their values are swapped by the `.dark` block in globals.css. `deep`, `ivory`, `gold`
// and `copper` are frozen — they back dark scrims, accent buttons and text-on-accent,
// which must stay dark/light in BOTH themes.
const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // earthy Madhura palette
        forest: {
          DEFAULT: v("forest-900"), 50: v("forest-50"), 100: v("forest-100"), 200: v("forest-200"),
          300: v("forest-300"), 400: v("forest-400"), 500: v("forest-500"), 600: v("forest-600"),
          700: v("forest-700"), 800: v("forest-800"), 900: v("forest-900"), 950: v("forest-950"),
        },
        // frozen dark greens — hero scrims, footer, primary buttons
        deep: { DEFAULT: "#2f3a22", 600: "#516132", 700: "#3f4d2e", 800: "#33402a", 900: "#2f3a22", 950: "#161d10" },
        // frozen light green — the admin panel is dark in both themes, so its accents
        // must not follow the storefront toggle
        sage: "#a7b781",
        olive: { DEFAULT: v("olive"), light: v("olive-light") },
        cream: { DEFAULT: v("cream"), warm: v("cream-warm") },
        surface: v("surface"),
        ivory: "#fffdf8",
        sand: { DEFAULT: v("sand"), dark: v("sand-dark") },
        gold: { DEFAULT: "#b98d3e", light: "#d4af64", dark: "#96702c" },
        copper: "#a86b48",
        bark: v("bark"),
        ink: v("ink"),
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        // figures: see the note in app/layout.tsx — the display serif's old-style
        // numerals are unusable for dashboard metrics
        numeric: ["var(--font-numeric)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 8px 30px -12px var(--c-shadow)",
        card: "0 4px 24px -8px var(--c-shadow)",
        lift: "0 18px 45px -15px var(--c-shadow-strong)",
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
