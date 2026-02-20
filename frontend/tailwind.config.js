/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        // Brand
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D4FB",
          300: "#A5B8F8",
          400: "#7F96F3",
          500: "#5B74EE",
          600: "#2D54E8", // main
          700: "#2344CC",
          800: "#1C37A3",
          900: "#1A3080",
        },
        accent: {
          400: "#FB923C",
          500: "#F97316", // main
          600: "#EA6C10",
        },
        // Neutral (warm-toned)
        warm: {
          50: "#FAF9F7",
          100: "#F7F6F2", // app background
          200: "#EFEDE6",
          300: "#E5E3DC", // borders
          400: "#C8C4BA",
          500: "#9B9690",
          600: "#726E68",
          700: "#4A4742",
          800: "#2C2A26",
          900: "#1A1916", // near-black
        },
        // Subject colors
        subject: {
          math: {
            bg: "#EEF2FF",
            text: "#2D54E8",
            border: "#C7D4FB",
            dot: "#2D54E8",
          },
          croatian: {
            bg: "#F0FDF4",
            text: "#15803D",
            border: "#BBF7D0",
            dot: "#16A34A",
          },
          english: {
            bg: "#FFFBEB",
            text: "#B45309",
            border: "#FDE68A",
            dot: "#D97706",
          },
          history: {
            bg: "#FEF2F2",
            text: "#B91C1C",
            border: "#FECACA",
            dot: "#DC2626",
          },
          biology: {
            bg: "#F5F3FF",
            text: "#6D28D9",
            border: "#DDD6FE",
            dot: "#7C3AED",
          },
          chemistry: {
            bg: "#ECFEFF",
            text: "#0E7490",
            border: "#A5F3FC",
            dot: "#0891B2",
          },
          physics: {
            bg: "#FDF4FF",
            text: "#A21CAF",
            border: "#F0ABFC",
            dot: "#C026D3",
          },
          geography: {
            bg: "#F0FFF4",
            text: "#065F46",
            border: "#A7F3D0",
            dot: "#059669",
          },
        },
        // Semantic
        success: {
          50: "#F0FDF4",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
        },
        error: {
          50: "#FEF2F2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        warning: { 50: "#FFFBEB", 500: "#F59E0B", 600: "#D97706" },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-md":
          "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        "card-lg":
          "0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
        "inset-top": "inset 0 1px 0 0 rgb(255 255 255 / 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-right": "slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
