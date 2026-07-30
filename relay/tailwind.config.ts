import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: "#EDF0EA",
        paper: "#F7F8F5",
        ink: "#16241E",
        primary: {
          DEFAULT: "#2F6F4F",
          dark: "#1F4C36",
          light: "#DCEAE1"
        },
        accent: {
          DEFAULT: "#E8A33D",
          dark: "#C2811F",
          light: "#FBEAD0"
        },
        muted: "#6B7A70",
        line: "#D8DED6"
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-plex)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"]
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "14px"
      }
    }
  },
  plugins: []
};
export default config;
