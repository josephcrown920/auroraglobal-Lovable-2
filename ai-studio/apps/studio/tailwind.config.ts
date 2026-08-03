import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#8B5CF6",
        accent: "#06B6D4",
      },
    },
  },
  plugins: [],
} satisfies Config;
