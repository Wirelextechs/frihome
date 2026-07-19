/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#effef7",
          100: "#d7fdec",
          200: "#b1fad9",
          300: "#78f2bd",
          400: "#3ce29c",
          500: "#14c885",
          600: "#09a36d",
          700: "#0a815a",
          800: "#0c654a",
          900: "#0c533e",
          950: "#032e23",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae2",
          300: "#b1bac8",
          400: "#8695a9",
          500: "#67788f",
          600: "#526078",
          700: "#434e62",
          800: "#394252",
          900: "#232833",
          950: "#14171e",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        "4xl": "2rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20, 23, 30, 0.04), 0 8px 24px -8px rgba(20, 23, 30, 0.10)",
        "soft-lg":
          "0 2px 4px rgba(20, 23, 30, 0.04), 0 16px 40px -12px rgba(20, 23, 30, 0.16)",
      },
      keyframes: {
        "sheet-in": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "sheet-out": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "overlay-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "overlay-out": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
      },
      animation: {
        "sheet-in": "sheet-in 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        "sheet-out": "sheet-out 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
        "overlay-in": "overlay-in 0.2s ease-out",
        "overlay-out": "overlay-out 0.2s ease-in",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
