/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050507",
        foreground: "#f3f4f6",
        card: {
          DEFAULT: "#0b0c10",
          foreground: "#f3f4f6",
          hover: "#12131a",
        },
        popover: {
          DEFAULT: "#0f1016",
          foreground: "#f3f4f6",
        },
        primary: {
          DEFAULT: "#8b5cf6",
          foreground: "#ffffff",
          glow: "rgba(139, 92, 246, 0.15)",
        },
        secondary: {
          DEFAULT: "#1e202e",
          foreground: "#9ca3af",
        },
        muted: {
          DEFAULT: "#13141c",
          foreground: "#9ca3af",
        },
        accent: {
          DEFAULT: "#06b6d4",
          foreground: "#ffffff",
        },
        border: "#1c1e2b",
        input: "#161824",
        ring: "#8b5cf6",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};
