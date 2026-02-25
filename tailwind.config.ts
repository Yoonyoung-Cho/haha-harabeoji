import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          DEFAULT: "#F5F0E8",
          dark: "#2C2416",
        },
      },
      fontSize: {
        "body-lg": ["1.5rem", { lineHeight: "1.6" }],
        "body-xl": ["1.875rem", { lineHeight: "1.6" }],
      },
    },
  },
  plugins: [],
} satisfies Config;
