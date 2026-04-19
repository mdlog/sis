/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#07080a",
          raised: "#0b0d10",
          subtle: "#0f1114",
        },
        line: {
          DEFAULT: "#1a1d22",
          strong: "#23272d",
        },
        ink: {
          50: "#f5f6f7",
          100: "#e5e7eb",
          200: "#cbd1d7",
          300: "#a0a8b1",
          400: "#737c86",
          500: "#4e565f",
          600: "#343a42",
          700: "#23272d",
          800: "#15181b",
          900: "#0b0d10",
        },
        accent: {
          DEFAULT: "#99ffb2",
          strong: "#7cf598",
          muted: "#5fcf7d",
          soft: "#99ffb21a",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.04em" }],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
      },
      letterSpacing: {
        widest: "0.18em",
      },
    },
  },
  plugins: [],
};
